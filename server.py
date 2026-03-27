from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== CONSTANTS & DEFAULTS ==============

# GoMining fee structure (based on official calculator)
# Electricity cost per kWh at GoMining data centers
GOMINING_ELECTRICITY_RATE = 0.05  # $/kWh (typical data center rate)

# Service fee is approximately 50% of electricity cost (based on GoMining examples)
SERVICE_FEE_RATIO = 0.50

# Cache settings
CACHE_TTL = 30  # seconds for price cache
NETWORK_CACHE_TTL = 300  # 5 minutes for network data

# Global cache
cache: Dict[str, Any] = {}


# ============== MODELS ==============

class NetworkStats(BaseModel):
    difficulty: float
    hashrate_eh: float  # Exahashes per second
    block_height: int
    block_reward: float = 3.125
    blocks_per_day: int = 144
    last_updated: str
    next_adjustment_block: Optional[int] = None
    estimated_adjustment_percent: Optional[float] = None


class FeeStats(BaseModel):
    electricity_rate_kwh: float
    service_fee_ratio: float
    gomining_token_discount: float
    vip_discount: float
    service_button_discount: float
    total_discount: float
    last_updated: str


class MiningCalculation(BaseModel):
    hashrate_th: float
    wattage_per_th: float
    electricity_cost: float = GOMINING_ELECTRICITY_RATE
    btc_price: float = 0
    vip_discount: float = 0.0
    gomining_discount: float = 0.0
    service_button_discount: float = 0.0
    use_live_difficulty: bool = True


class PayoutResult(BaseModel):
    # Gross mining reward
    daily_btc_gross: float
    
    # Fee breakdown
    electricity_cost_btc: float
    electricity_cost_usd: float
    service_fee_btc: float
    service_fee_usd: float
    total_maintenance_btc: float
    total_maintenance_usd: float
    
    # Discounts
    discount_btc: float
    discount_usd: float
    discount_percent: float
    
    # Net rewards
    daily_btc_net: float
    daily_usd_net: float
    monthly_btc_net: float
    monthly_usd_net: float
    yearly_btc_net: float
    yearly_usd_net: float
    
    # Network info used
    network_difficulty: float
    network_hashrate_eh: float
    btc_price_used: float


class CryptoPrice(BaseModel):
    coin_id: str
    symbol: str
    price_usd: float
    price_change_24h: float
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    last_updated: str


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# ============== NETWORK TRACKING BOT ==============

async def fetch_network_difficulty() -> Optional[NetworkStats]:
    """
    Fetch Bitcoin network difficulty and hashrate from multiple sources.
    Primary: mempool.space API
    Fallback: blockchain.info API
    """
    global cache
    
    cache_key = "network_stats"
    now = datetime.now(timezone.utc).timestamp()
    
    # Check cache first
    if cache_key in cache:
        cached = cache[cache_key]
        if now - cached['timestamp'] < NETWORK_CACHE_TTL:
            return cached['data']
    
    network_stats = None
    
    try:
        async with httpx.AsyncClient() as http_client:
            # Try mempool.space first (more detailed)
            try:
                # Get difficulty adjustment info
                diff_response = await http_client.get(
                    "https://mempool.space/api/v1/difficulty-adjustment",
                    timeout=10.0
                )
                
                if diff_response.status_code == 200:
                    diff_data = diff_response.json()
                    
                    # Get hashrate from mining stats
                    hashrate_response = await http_client.get(
                        "https://mempool.space/api/v1/mining/hashrate/3d",
                        timeout=10.0
                    )
                    
                    hashrate_eh = 800.0  # Default fallback
                    if hashrate_response.status_code == 200:
                        hr_data = hashrate_response.json()
                        if hr_data.get('currentHashrate'):
                            # Convert H/s to EH/s
                            hashrate_eh = hr_data['currentHashrate'] / 1e18
                        elif hr_data.get('hashrates') and len(hr_data['hashrates']) > 0:
                            hashrate_eh = hr_data['hashrates'][-1].get('avgHashrate', 800e18) / 1e18
                    
                    # Get current block height
                    block_response = await http_client.get(
                        "https://mempool.space/api/blocks/tip/height",
                        timeout=10.0
                    )
                    block_height = int(block_response.text) if block_response.status_code == 200 else 0
                    
                    # Get actual difficulty from blockchain.info (more reliable)
                    actual_diff = 100e12  # Default
                    try:
                        diff_actual_response = await http_client.get(
                            "https://blockchain.info/q/getdifficulty",
                            timeout=10.0
                        )
                        if diff_actual_response.status_code == 200:
                            actual_diff = float(diff_actual_response.text)
                    except:
                        pass
                    
                    network_stats = NetworkStats(
                        difficulty=actual_diff,
                        hashrate_eh=hashrate_eh,
                        block_height=block_height,
                        block_reward=3.125,
                        blocks_per_day=144,
                        last_updated=datetime.now(timezone.utc).isoformat(),
                        next_adjustment_block=diff_data.get('nextRetargetHeight'),
                        estimated_adjustment_percent=diff_data.get('difficultyChange')
                    )
                    
            except Exception as e:
                logger.warning(f"mempool.space API failed: {e}, trying blockchain.info")
            
            # Fallback to blockchain.info
            if not network_stats:
                try:
                    # Get difficulty
                    diff_response = await http_client.get(
                        "https://blockchain.info/q/getdifficulty",
                        timeout=10.0
                    )
                    
                    difficulty = float(diff_response.text) if diff_response.status_code == 200 else 100e12
                    
                    # Get block count
                    block_response = await http_client.get(
                        "https://blockchain.info/q/getblockcount",
                        timeout=10.0
                    )
                    block_height = int(block_response.text) if block_response.status_code == 200 else 0
                    
                    # Get next retarget
                    retarget_response = await http_client.get(
                        "https://blockchain.info/q/nextretarget",
                        timeout=10.0
                    )
                    next_retarget = int(retarget_response.text) if retarget_response.status_code == 200 else None
                    
                    # Estimate hashrate from difficulty
                    # hashrate (H/s) ≈ difficulty * 2^32 / 600
                    hashrate_h = (difficulty * (2**32)) / 600
                    hashrate_eh = hashrate_h / 1e18
                    
                    network_stats = NetworkStats(
                        difficulty=difficulty,
                        hashrate_eh=hashrate_eh,
                        block_height=block_height,
                        block_reward=3.125,
                        blocks_per_day=144,
                        last_updated=datetime.now(timezone.utc).isoformat(),
                        next_adjustment_block=next_retarget,
                        estimated_adjustment_percent=None
                    )
                    
                except Exception as e:
                    logger.error(f"blockchain.info API also failed: {e}")
    
    except Exception as e:
        logger.error(f"Network fetch error: {e}")
    
    # If all APIs failed, use reasonable defaults
    if not network_stats:
        network_stats = NetworkStats(
            difficulty=100e12,  # ~100T
            hashrate_eh=800.0,  # ~800 EH/s
            block_height=0,
            block_reward=3.125,
            blocks_per_day=144,
            last_updated=datetime.now(timezone.utc).isoformat(),
            next_adjustment_block=None,
            estimated_adjustment_percent=None
        )
    
    # Cache the result
    cache[cache_key] = {
        'data': network_stats,
        'timestamp': now
    }
    
    # Store in MongoDB for historical tracking
    try:
        await db.network_stats.insert_one({
            **network_stats.model_dump(),
            'recorded_at': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to store network stats: {e}")
    
    return network_stats


async def fetch_crypto_prices(coin_ids: List[str]) -> Dict[str, CryptoPrice]:
    """Fetch crypto prices from CoinGecko free API"""
    global cache
    
    now = datetime.now(timezone.utc).timestamp()
    results = {}
    coins_to_fetch = []
    
    # Check cache first
    for coin_id in coin_ids:
        cache_key = f"price_{coin_id}"
        if cache_key in cache:
            cached = cache[cache_key]
            if now - cached['timestamp'] < CACHE_TTL:
                results[coin_id] = cached['data']
            else:
                coins_to_fetch.append(coin_id)
        else:
            coins_to_fetch.append(coin_id)
    
    # Fetch missing coins
    if coins_to_fetch:
        try:
            async with httpx.AsyncClient() as http_client:
                ids_param = ','.join(coins_to_fetch)
                response = await http_client.get(
                    f"https://api.coingecko.com/api/v3/simple/price",
                    params={
                        'ids': ids_param,
                        'vs_currencies': 'usd',
                        'include_24hr_change': 'true',
                        'include_market_cap': 'true',
                        'include_24hr_vol': 'true'
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    symbol_map = {
                        'bitcoin': 'BTC',
                        'gmt-token': 'GOMINING'
                    }
                    
                    for coin_id in coins_to_fetch:
                        if coin_id in data:
                            coin_data = data[coin_id]
                            price_obj = CryptoPrice(
                                coin_id=coin_id,
                                symbol=symbol_map.get(coin_id, coin_id.upper()),
                                price_usd=coin_data.get('usd', 0),
                                price_change_24h=coin_data.get('usd_24h_change', 0),
                                market_cap=coin_data.get('usd_market_cap'),
                                volume_24h=coin_data.get('usd_24h_vol'),
                                last_updated=datetime.now(timezone.utc).isoformat()
                            )
                            results[coin_id] = price_obj
                            cache[f"price_{coin_id}"] = {
                                'data': price_obj,
                                'timestamp': now
                            }
                else:
                    logger.warning(f"CoinGecko API returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching prices: {e}")
    
    return results


# ============== MINING CALCULATION ==============

async def calculate_mining_payout(
    hashrate_th: float,
    wattage_per_th: float,
    btc_price: float,
    electricity_rate: float = GOMINING_ELECTRICITY_RATE,
    vip_discount: float = 0.0,
    gomining_discount: float = 0.0,
    service_button_discount: float = 3.0,
    use_live_difficulty: bool = True
) -> PayoutResult:
    """
    Calculate mining payout using GoMining's official formula:
    
    NetReward = PoolReward - ((Electricity + Service) × (1 - Discounts))
    
    Uses live network difficulty for accurate calculations.
    """
    
    # Get live network stats
    network_stats = await fetch_network_difficulty() if use_live_difficulty else None
    
    if network_stats:
        network_hashrate_th = network_stats.hashrate_eh * 1e6  # Convert EH/s to TH/s
        difficulty = network_stats.difficulty
    else:
        # Fallback values
        network_hashrate_th = 800e6  # 800 EH/s in TH/s
        difficulty = 100e12
    
    # Daily BTC mined by the network
    blocks_per_day = 144
    btc_per_block = 3.125
    daily_network_btc = blocks_per_day * btc_per_block  # ~450 BTC/day
    
    # Calculate miner's share of network hashrate
    # Daily BTC gross = (miner hashrate / network hashrate) * daily network BTC
    hashrate_share = hashrate_th / network_hashrate_th
    daily_btc_gross = hashrate_share * daily_network_btc
    
    # ============== ELECTRICITY FEE CALCULATION ==============
    # Based on GoMining's model: fee based on W/TH efficiency
    
    # Total power consumption in watts
    total_watts = hashrate_th * wattage_per_th
    
    # Daily electricity consumption in kWh
    daily_kwh = (total_watts * 24) / 1000
    
    # Daily electricity cost in USD
    electricity_cost_usd = daily_kwh * electricity_rate
    
    # Convert to BTC
    electricity_cost_btc = electricity_cost_usd / btc_price if btc_price > 0 else 0
    
    # ============== SERVICE FEE CALCULATION ==============
    # Service fee is approximately 50% of electricity cost (GoMining model)
    
    service_fee_usd = electricity_cost_usd * SERVICE_FEE_RATIO
    service_fee_btc = service_fee_usd / btc_price if btc_price > 0 else 0
    
    # ============== TOTAL MAINTENANCE ==============
    
    total_maintenance_btc = electricity_cost_btc + service_fee_btc
    total_maintenance_usd = electricity_cost_usd + service_fee_usd
    
    # ============== APPLY DISCOUNTS ==============
    # Discounts apply to maintenance fees
    # VIP: up to 6%, GOMINING token: up to 20%, Service button: up to 3%
    
    total_discount_percent = min(vip_discount + gomining_discount + service_button_discount, 29.0)
    
    discount_btc = total_maintenance_btc * (total_discount_percent / 100)
    discount_usd = total_maintenance_usd * (total_discount_percent / 100)
    
    # Final maintenance after discounts
    final_maintenance_btc = total_maintenance_btc - discount_btc
    
    # ============== NET REWARD ==============
    
    daily_btc_net = daily_btc_gross - final_maintenance_btc
    daily_usd_net = daily_btc_net * btc_price
    
    return PayoutResult(
        daily_btc_gross=daily_btc_gross,
        electricity_cost_btc=electricity_cost_btc,
        electricity_cost_usd=electricity_cost_usd,
        service_fee_btc=service_fee_btc,
        service_fee_usd=service_fee_usd,
        total_maintenance_btc=total_maintenance_btc,
        total_maintenance_usd=total_maintenance_usd,
        discount_btc=discount_btc,
        discount_usd=discount_usd,
        discount_percent=total_discount_percent,
        daily_btc_net=max(0, daily_btc_net),
        daily_usd_net=max(0, daily_usd_net),
        monthly_btc_net=max(0, daily_btc_net * 30),
        monthly_usd_net=max(0, daily_usd_net * 30),
        yearly_btc_net=max(0, daily_btc_net * 365),
        yearly_usd_net=max(0, daily_usd_net * 365),
        network_difficulty=difficulty if network_stats else 0,
        network_hashrate_eh=network_stats.hashrate_eh if network_stats else 800,
        btc_price_used=btc_price
    )


# ============== BACKGROUND TASKS / BOTS ==============

async def network_tracking_bot():
    """
    Background bot that periodically fetches and stores network difficulty.
    Runs every 5 minutes to track changes.
    """
    while True:
        try:
            logger.info("Network tracking bot: Fetching network stats...")
            stats = await fetch_network_difficulty()
            if stats:
                logger.info(f"Network stats updated: Difficulty={stats.difficulty:.2e}, Hashrate={stats.hashrate_eh:.2f} EH/s")
        except Exception as e:
            logger.error(f"Network tracking bot error: {e}")
        
        # Wait 5 minutes before next fetch
        await asyncio.sleep(300)


async def fee_tracking_bot():
    """
    Background bot that monitors and logs fee changes.
    Could be extended to fetch dynamic fee data from GoMining API if available.
    """
    while True:
        try:
            logger.info("Fee tracking bot: Logging current fee structure...")
            
            # Store current fee structure
            fee_record = {
                'electricity_rate_kwh': GOMINING_ELECTRICITY_RATE,
                'service_fee_ratio': SERVICE_FEE_RATIO,
                'recorded_at': datetime.now(timezone.utc).isoformat()
            }
            
            await db.fee_history.insert_one(fee_record)
            logger.info(f"Fee structure logged: ${GOMINING_ELECTRICITY_RATE}/kWh, {SERVICE_FEE_RATIO*100}% service")
            
        except Exception as e:
            logger.error(f"Fee tracking bot error: {e}")
        
        # Run once per hour
        await asyncio.sleep(3600)


# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "GoMining Portfolio Tracker API", "version": "2.0"}


@api_router.get("/network-stats")
async def get_network_stats():
    """Get current Bitcoin network statistics (difficulty, hashrate)"""
    stats = await fetch_network_difficulty()
    if not stats:
        raise HTTPException(status_code=503, detail="Unable to fetch network stats")
    return stats


@api_router.get("/network-stats/history")
async def get_network_stats_history(limit: int = 100):
    """Get historical network stats for charting"""
    history = await db.network_stats.find(
        {}, 
        {"_id": 0}
    ).sort("recorded_at", -1).limit(limit).to_list(limit)
    return {"history": history}


@api_router.get("/fees")
async def get_current_fees():
    """Get current fee structure"""
    return FeeStats(
        electricity_rate_kwh=GOMINING_ELECTRICITY_RATE,
        service_fee_ratio=SERVICE_FEE_RATIO,
        gomining_token_discount=20.0,
        vip_discount=6.0,
        service_button_discount=3.0,
        total_discount=29.0,
        last_updated=datetime.now(timezone.utc).isoformat()
    )


@api_router.get("/prices")
async def get_prices():
    """Get BTC and GMT prices"""
    prices = await fetch_crypto_prices(['bitcoin', 'gmt-token'])
    return {
        "btc": prices.get('bitcoin'),
        "gmt": prices.get('gmt-token'),
        "cached": any(f"price_{coin}" in cache for coin in ['bitcoin', 'gmt-token'])
    }


@api_router.get("/price/{coin_id}")
async def get_single_price(coin_id: str):
    """Get price for a specific coin"""
    prices = await fetch_crypto_prices([coin_id])
    if coin_id not in prices:
        raise HTTPException(status_code=404, detail=f"Coin {coin_id} not found")
    return prices[coin_id]


@api_router.post("/calculate-payout", response_model=PayoutResult)
async def calculate_payout_endpoint(calc: MiningCalculation):
    """
    Calculate mining payout based on hashrate and wattage.
    Uses live network difficulty for accurate calculations.
    """
    # Get BTC price if not provided
    btc_price = calc.btc_price
    if btc_price <= 0:
        prices = await fetch_crypto_prices(['bitcoin'])
        if 'bitcoin' in prices:
            btc_price = prices['bitcoin'].price_usd
        else:
            btc_price = 70000  # Fallback
    
    return await calculate_mining_payout(
        hashrate_th=calc.hashrate_th,
        wattage_per_th=calc.wattage_per_th,
        btc_price=btc_price,
        electricity_rate=calc.electricity_cost,
        vip_discount=calc.vip_discount,
        gomining_discount=calc.gomining_discount,
        service_button_discount=calc.service_button_discount,
        use_live_difficulty=calc.use_live_difficulty
    )


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.get("/bot-status")
async def get_bot_status():
    """Check status of tracking bots"""
    # Get latest network stats from DB
    latest_network = await db.network_stats.find_one(
        {}, 
        {"_id": 0},
        sort=[("recorded_at", -1)]
    )
    
    # Get latest fee record
    latest_fee = await db.fee_history.find_one(
        {},
        {"_id": 0},
        sort=[("recorded_at", -1)]
    )
    
    return {
        "network_bot": {
            "status": "running",
            "last_update": latest_network.get('recorded_at') if latest_network else None,
            "latest_difficulty": latest_network.get('difficulty') if latest_network else None,
            "latest_hashrate_eh": latest_network.get('hashrate_eh') if latest_network else None
        },
        "fee_bot": {
            "status": "running", 
            "last_update": latest_fee.get('recorded_at') if latest_fee else None,
            "electricity_rate": latest_fee.get('electricity_rate_kwh') if latest_fee else GOMINING_ELECTRICITY_RATE
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Start background tracking bots on app startup"""
    logger.info("Starting tracking bots...")
    
    # Start network tracking bot
    asyncio.create_task(network_tracking_bot())
    logger.info("Network tracking bot started")
    
    # Start fee tracking bot
    asyncio.create_task(fee_tracking_bot())
    logger.info("Fee tracking bot started")
    
    # Initial fetch
    await fetch_network_difficulty()
    logger.info("Initial network stats fetched")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
