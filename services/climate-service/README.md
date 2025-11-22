# Climate Data Microservice (Python)

A Python microservice for fetching climate data by ZIP code.

## Frameworks

### Option 1: FastAPI (Recommended)
- Fast, modern, async support
- Automatic OpenAPI/Swagger docs
- Type hints and validation
- Easy to integrate with Node.js

### Option 2: Flask
- Lightweight, simple
- Large ecosystem
- Good for simple APIs

### Option 3: Nameko
- Built for microservices
- Service discovery
- RPC communication

## Climate Data Sources

### 1. NOAA Climate Data API
- Free, official US climate data
- Historical weather data
- Climate normals

### 2. OpenWeatherMap API
- Current and forecast data
- Historical data available
- Free tier available

### 3. WeatherAPI.com
- Climate data
- Historical data
- Free tier available

### 4. ASHRAE/ACCA Climate Data
- Professional HVAC design data
- May require licensing
- Most accurate for Manual J

## Example FastAPI Service

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI()

class ClimateResponse(BaseModel):
    zipCode: str
    summerDesignTemp: float
    winterDesignTemp: float
    latitude: float
    longitude: float

@app.get("/climate/{zip_code}")
async def get_climate_data(zip_code: str):
    # 1. Geocode ZIP code
    # 2. Fetch climate data from NOAA/WeatherAPI
    # 3. Calculate design temperatures
    # 4. Return structured data
    pass
```

## Integration with Node.js

Call from your Node.js API route:
```typescript
const response = await fetch('http://climate-service:8000/climate/90210');
const data = await response.json();
```

