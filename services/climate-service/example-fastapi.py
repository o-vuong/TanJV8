"""
Example FastAPI microservice for climate data
Run with: uvicorn example-fastapi:app --reload --port 8000
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from typing import Optional

app = FastAPI(title="Climate Data Service")

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClimateResponse(BaseModel):
    zipCode: str
    summerDesignTemp: float
    winterDesignTemp: float
    latitude: float
    longitude: float
    source: str = "estimated"


async def geocode_zip(zip_code: str) -> tuple[float, float]:
    """Geocode ZIP code to lat/long using OpenCage or fallback"""
    # Option 1: Use OpenCage API (if API key available)
    # Option 2: Use USPS API
    # Option 3: Use ZIP code database
    
    # Fallback: Rough estimation based on ZIP ranges
    zip_num = int(zip_code)
    if zip_num < 30000:  # East Coast
        return (40.0 + (zip_num / 10000) * 5, -75.0 - (zip_num / 10000) * 10)
    elif zip_num < 50000:  # South
        return (35.0 + (zip_num / 10000) * 5, -85.0 - (zip_num / 10000) * 5)
    elif zip_num < 70000:  # Midwest
        return (40.0 + (zip_num / 10000) * 5, -90.0 - (zip_num / 10000) * 5)
    elif zip_num >= 80000:  # Mountain/West
        return (38.0 + (zip_num / 10000) * 3, -105.0 - (zip_num / 10000) * 5)
    else:  # West Coast
        return (34.0 + (zip_num / 10000) * 2, -118.0 - (zip_num / 10000) * 2)


async def fetch_noaa_climate_data(lat: float, lon: float) -> Optional[dict]:
    """Fetch climate data from NOAA API"""
    try:
        # NOAA Climate Data API endpoint
        # Note: You'll need to register for API access
        async with httpx.AsyncClient() as client:
            # Example endpoint (adjust based on actual NOAA API)
            response = await client.get(
                f"https://www.ncei.noaa.gov/cdo-web/api/v2/data",
                params={"datasetid": "NORMAL_ANN", "locationid": f"ZIP:{lat},{lon}"},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"NOAA API error: {e}")
    return None


def estimate_design_temps(lat: float, lon: float) -> tuple[float, float]:
    """Estimate design temperatures based on location"""
    # Base temperatures
    summer = 85.0
    winter = 30.0
    
    # Adjust for latitude
    lat_adj = (lat - 35) * 1.5
    winter -= lat_adj
    summer -= lat_adj * 0.3
    
    # Adjust for coastal regions
    if lon < -120:  # West Coast
        winter += 10
        summer -= 5
    elif lon > -80:  # East Coast
        winter -= 5
    
    # Clamp values
    summer = max(75, min(105, summer))
    winter = max(-20, min(50, winter))
    
    return round(summer, 1), round(winter, 1)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "climate-data"}


@app.get("/climate/{zip_code}", response_model=ClimateResponse)
async def get_climate_data(zip_code: str):
    """
    Get climate data for a ZIP code
    
    - **zip_code**: 5-digit US ZIP code
    - Returns: Climate data including design temperatures and coordinates
    """
    # Validate ZIP code format
    if not zip_code.isdigit() or len(zip_code) != 5:
        raise HTTPException(status_code=400, detail="Invalid ZIP code format")
    
    try:
        # Geocode ZIP code
        latitude, longitude = await geocode_zip(zip_code)
        
        # Try to fetch from NOAA (if available)
        noaa_data = await fetch_noaa_climate_data(latitude, longitude)
        
        if noaa_data:
            # Parse NOAA data (implementation depends on API response format)
            summer_temp = 90.0  # Extract from NOAA data
            winter_temp = 20.0  # Extract from NOAA data
            source = "noaa"
        else:
            # Fallback to estimation
            summer_temp, winter_temp = estimate_design_temps(latitude, longitude)
            source = "estimated"
        
        return ClimateResponse(
            zipCode=zip_code,
            summerDesignTemp=summer_temp,
            winterDesignTemp=winter_temp,
            latitude=latitude,
            longitude=longitude,
            source=source
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching climate data: {str(e)}")


@app.get("/")
async def root():
    """API information"""
    return {
        "service": "Climate Data Microservice",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "climate": "/climate/{zip_code}"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

