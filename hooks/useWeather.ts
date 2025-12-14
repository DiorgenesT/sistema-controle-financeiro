import { useState, useEffect } from 'react'
import { weatherService, WeatherData } from '@/lib/services/weather.service'

interface UseWeatherResult {
    weather: WeatherData | null
    loading: boolean
    error: string | null
    refresh: () => void
}

export function useWeather(): UseWeatherResult {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadWeather = async () => {
        console.log('🌤️ [useWeather] Iniciando carregamento do clima...')
        try {
            setLoading(true)
            setError(null)
            console.log('🌤️ [useWeather] Chamando weatherService.getCurrentWeather()...')
            const data = await weatherService.getCurrentWeather()
            console.log('🌤️ [useWeather] Dados recebidos:', data)
            setWeather(data)
        } catch (err) {
            console.error('❌ [useWeather] Erro ao carregar clima:', err)
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
            // Usar fallback mesmo com erro
            const fallback = {
                condition: 'clear' as const,
                isDay: new Date().getHours() >= 6 && new Date().getHours() < 18,
                temp: 25,
                city: 'Sua cidade',
                description: 'Tempo agradável'
            }
            console.log('🌤️ [useWeather] Usando fallback:', fallback)
            setWeather(fallback)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('🌤️ [useWeather] useEffect disparado, carregando clima...')
        loadWeather()
    }, [])

    return {
        weather,
        loading,
        error,
        refresh: loadWeather
    }
}
