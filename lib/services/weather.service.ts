export interface WeatherData {
    condition: 'clear' | 'clouds' | 'rain' | 'thunderstorm' | 'snow' | 'mist'
    isDay: boolean
    temp: number
    city: string
    description: string
}

interface GeolocationCoords {
    lat: number
    lon: number
}

const CACHE_KEY = 'weather_cache_v2' // Nova versão para invalidar cache antigo
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

class WeatherService {
    // Open-Meteo não precisa de API key! 🎉

    // Obter clima atual
    async getCurrentWeather(): Promise<WeatherData> {
        console.log('☀️ [WeatherService] getCurrentWeather() chamado')

        // Verificar cache primeiro
        const cached = this.getFromCache()
        if (cached) {
            console.log('📦 [WeatherService] Usando cache:', cached)
            return cached
        }

        console.log('🌐 [WeatherService] Cache não encontrado, buscando da API...')

        try {
            // Tentar obter localização
            console.log('📍 [WeatherService] Obtendo localização do navegador...')
            const coords = await this.getLocationFromBrowser()
            console.log('✅ [WeatherService] Coordenadas obtidas:', coords)

            // Buscar clima da API Open-Meteo
            const weather = await this.fetchWeatherData(coords)

            // Salvar no cache
            this.saveToCache(weather)

            return weather
        } catch (error) {
            console.warn('⚠️ [WeatherService] Erro ao obter clima, usando fallback:', error)
            return this.getFallbackWeather()
        }
    }

    // Obter geolocalização do browser
    private async getLocationFromBrowser(): Promise<GeolocationCoords> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    })
                },
                (error) => {
                    reject(error)
                },
                { timeout: 5000 }
            )
        })
    }

    // Buscar dados da API Open-Meteo (GRATUITA, SEM API KEY!)
    private async fetchWeatherData(coords: GeolocationCoords): Promise<WeatherData> {
        // API Open-Meteo - 100% gratuita, sem cadastro!
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const current = data.current_weather

        // Buscar nome da cidade (opcional, sem bloquear se falhar)
        let cityName = await this.getCityName(coords)

        // Se falhou no geocoding, usar coordenadas como referência
        if (cityName === 'Sua cidade') {
            cityName = `${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°`
        }

        console.log('🌍 Cidade obtida:', cityName, 'Coords:', coords)

        return {
            condition: this.mapWeatherCode(current.weathercode),
            isDay: current.is_day === 1,
            temp: Math.round(current.temperature),
            city: cityName,
            description: this.getWeatherDescription(current.weathercode, current.is_day === 1)
        }
    }

    // Buscar nome da cidade usando Geocoding API do Open-Meteo
    private async getCityName(coords: GeolocationCoords): Promise<string> {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.lat}&longitude=${coords.lon}&count=1`
            console.log('🔍 Buscando cidade:', url)

            const response = await fetch(url)
            console.log('📡 Response status:', response.status)

            if (!response.ok) {
                console.warn('❌ Geocoding API error:', response.status)
                return 'Sua cidade'
            }

            const data = await response.json()
            console.log('📍 Geocoding data:', data)

            if (data.results && data.results.length > 0) {
                const result = data.results[0]
                const cityName = result.name || result.admin1 || 'Sua cidade'
                console.log('✅ Cidade encontrada:', cityName)
                return cityName
            }

            console.warn('⚠️ Nenhum resultado de geocoding')
            return 'Sua cidade'
        } catch (error) {
            console.error('💥 Erro no geocoding:', error)
            return 'Sua cidade'
        }
    }

    // Mapear códigos WMO (World Meteorological Organization) para nossas condições
    // Documentação: https://open-meteo.com/en/docs
    private mapWeatherCode(code: number): WeatherData['condition'] {
        // Código WMO Weather interpretation
        if (code === 0 || code === 1) return 'clear' // Céu limpo / Principalmente limpo
        if (code === 2 || code === 3) return 'clouds' // Parcialmente nublado / Nublado
        if (code === 45 || code === 48) return 'mist' // Neblina
        if (code >= 51 && code <= 67) return 'rain' // Chuva leve a forte
        if (code >= 71 && code <= 77) return 'snow' // Neve
        if (code >= 80 && code <= 82) return 'rain' // Pancadas de chuva
        if (code >= 85 && code <= 86) return 'snow' // Pancadas de neve
        if (code >= 95 && code <= 99) return 'thunderstorm' // Trovoadas

        return 'clear' // Default
    }

    // Obter descrição em português baseada no código
    private getWeatherDescription(code: number, isDay: boolean): string {
        const descriptions: Record<number, string> = {
            0: isDay ? 'Céu limpo' : 'Noite clara',
            1: isDay ? 'Principalmente limpo' : 'Noite clara',
            2: 'Parcialmente nublado',
            3: 'Nublado',
            45: 'Neblina',
            48: 'Neblina gelada',
            51: 'Garoa leve',
            53: 'Garoa moderada',
            55: 'Garoa forte',
            61: 'Chuva leve',
            63: 'Chuva moderada',
            65: 'Chuva forte',
            71: 'Neve leve',
            73: 'Neve moderada',
            75: 'Neve forte',
            80: 'Pancadas leves',
            81: 'Pancadas moderadas',
            82: 'Pancadas fortes',
            85: 'Neve leve',
            86: 'Neve forte',
            95: 'Trovoada',
            96: 'Trovoada com granizo',
            99: 'Trovoada forte'
        }

        return descriptions[code] || (isDay ? 'Tempo bom' : 'Noite agradável')
    }

    // Detectar hora do dia (fallback sem API)
    private detectTimeOfDay(): boolean {
        const hour = new Date().getHours()
        return hour >= 6 && hour < 18
    }

    // Clima fallback (baseado apenas na hora)
    private getFallbackWeather(): WeatherData {
        const isDay = this.detectTimeOfDay()
        return {
            condition: 'clear',
            isDay,
            temp: 25,
            city: 'Sua cidade',
            description: isDay ? 'Dia ensolarado' : 'Noite clara'
        }
    }

    // Cache local
    private getFromCache(): WeatherData | null {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            if (!cached) return null

            const { data, timestamp } = JSON.parse(cached)
            const now = Date.now()

            if (now - timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY)
                return null
            }

            return data
        } catch {
            return null
        }
    }

    private saveToCache(data: WeatherData): void {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }))
        } catch {
            // Ignorar erro de storage
        }
    }
}

export const weatherService = new WeatherService()
