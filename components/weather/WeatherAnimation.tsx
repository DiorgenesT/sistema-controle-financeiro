'use client'

import { WeatherData } from '@/lib/services/weather.service'

interface WeatherAnimationProps {
    condition: WeatherData['condition']
    isDay: boolean
}

export function WeatherAnimation({ condition, isDay }: WeatherAnimationProps) {
    // Calcular fase da lua (0-1, onde 0=nova, 0.5=cheia)
    const getMoonPhase = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth() + 1
        const day = today.getDate()

        // Algoritmo simplificado para fase da lua
        let c = 0, e = 0, jd = 0, b = 0

        if (month < 3) {
            const yearTemp = year - 1
            const monthTemp = month + 12
            c = Math.floor(yearTemp / 100)
            e = Math.floor(c / 4)
            jd = 365.25 * (yearTemp + 4716)
            b = Math.floor(30.6001 * (monthTemp + 1))
        } else {
            c = Math.floor(year / 100)
            e = Math.floor(c / 4)
            jd = 365.25 * (year + 4716)
            b = Math.floor(30.6001 * (month + 1))
        }

        const phase = ((jd + b + day + 2 - c + e - 1524.5) % 29.53) / 29.53
        return phase
    }

    const moonPhase = getMoonPhase()

    // Determinar visual da lua baseado na fase
    const getMoonStyle = () => {
        if (moonPhase < 0.125 || moonPhase > 0.875) {
            // Lua Nova (escura)
            return { display: 'block', clipPath: 'circle(50%)', opacity: 0.3 }
        } else if (moonPhase >= 0.125 && moonPhase < 0.375) {
            // Crescente
            return { display: 'block', clipPath: 'ellipse(50% 50% at 40% 50%)' }
        } else if (moonPhase >= 0.375 && moonPhase < 0.625) {
            // Cheia
            return { display: 'block', clipPath: 'circle(50%)' }
        } else {
            // Minguante
            return { display: 'block', clipPath: 'ellipse(50% 50% at 60% 50%)' }
        }
    }

    // Classes base para o container
    const getBackgroundGradient = () => {
        if (condition === 'thunderstorm') {
            return 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
        }
        if (condition === 'rain') {
            return 'bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700'
        }
        if (condition === 'snow') {
            return 'bg-gradient-to-br from-gray-200 via-gray-100 to-white'
        }
        if (condition === 'mist') {
            return 'bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500'
        }
        if (condition === 'clouds') {
            if (isDay) {
                return 'bg-gradient-to-br from-blue-300 via-blue-200 to-gray-300'
            }
            return 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-gray-900'
        }
        // Clear
        if (isDay) {
            return 'bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-300'
        }
        return 'bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-950'
    }

    return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-1000 ${getBackgroundGradient()}`}>
            {/* SOL (Dia + Clear ou Clouds) */}
            {isDay && (condition === 'clear' || condition === 'clouds') && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Núcleo do sol - Tamanho reduzido */}
                    <div
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-300"
                        style={{
                            animation: 'sun-glow 4s ease-in-out infinite',
                            boxShadow: '0 0 30px rgba(253, 224, 71, 0.6)'
                        }}
                    />

                    {/* Nuvens na frente do sol (igual às que passam) */}
                    {condition === 'clouds' && (
                        <>
                            {/* Nuvem 1 - esquerda superior */}
                            <div className="absolute -top-1 -left-10 w-24 h-12 opacity-90">
                                <div className="absolute w-12 h-9 bg-white dark:bg-gray-300 rounded-full left-0 top-2" />
                                <div className="absolute w-14 h-10 bg-white dark:bg-gray-300 rounded-full left-6 top-0" />
                                <div className="absolute w-10 h-8 bg-white dark:bg-gray-300 rounded-full left-12 top-3" />
                            </div>

                            {/* Nuvem 2 - direita inferior */}
                            <div className="absolute -bottom-2 -right-8 w-20 h-10 opacity-85">
                                <div className="absolute w-10 h-7 bg-white dark:bg-gray-300 rounded-full left-0 top-2" />
                                <div className="absolute w-12 h-8 bg-white dark:bg-gray-300 rounded-full left-5 top-0" />
                                <div className="absolute w-9 h-6 bg-white dark:bg-gray-300 rounded-full left-10 top-3" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* LUA (Noite + Clear ou Clouds) */}
            {!isDay && (condition === 'clear' || condition === 'clouds') && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-100"
                        style={{
                            animation: 'moon-glow 6s ease-in-out infinite',
                            ...getMoonStyle()
                        }}
                    >
                        {/* Crateras (apenas em lua crescente/cheia) */}
                        {moonPhase > 0.125 && moonPhase < 0.875 && (
                            <>
                                <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-gray-300 opacity-40" />
                                <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-gray-300 opacity-40" />
                                <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gray-300 opacity-30" />
                            </>
                        )}
                    </div>

                    {/* Nuvens na frente da lua (igual às do sol) */}
                    {condition === 'clouds' && (
                        <>
                            {/* Nuvem 1 - esquerda superior */}
                            <div className="absolute -top-1 -left-10 w-24 h-12 opacity-90">
                                <div className="absolute w-12 h-9 bg-gray-600 dark:bg-gray-500 rounded-full left-0 top-2" />
                                <div className="absolute w-14 h-10 bg-gray-600 dark:bg-gray-500 rounded-full left-6 top-0" />
                                <div className="absolute w-10 h-8 bg-gray-600 dark:bg-gray-500 rounded-full left-12 top-3" />
                            </div>

                            {/* Nuvem 2 - direita inferior */}
                            <div className="absolute -bottom-2 -right-8 w-20 h-10 opacity-85">
                                <div className="absolute w-10 h-7 bg-gray-600 dark:bg-gray-500 rounded-full left-0 top-2" />
                                <div className="absolute w-12 h-8 bg-gray-600 dark:bg-gray-500 rounded-full left-5 top-0" />
                                <div className="absolute w-9 h-6 bg-gray-600 dark:bg-gray-500 rounded-full left-10 top-3" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ESTRELAS (Noite Clear) */}
            {!isDay && condition === 'clear' && (
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                top: `${Math.random() * 60}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `stars-twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* NUVENS */}
            {(condition === 'clouds' || condition === 'rain' || condition === 'thunderstorm') && (
                <div className="absolute inset-0">
                    {/* Nuvem 1 */}
                    <div
                        className="absolute w-32 h-16 md:w-40 md:h-20 opacity-80"
                        style={{
                            top: '20%',
                            animation: 'clouds-move-1 30s linear infinite'
                        }}
                    >
                        <div className="absolute w-16 h-12 bg-white dark:bg-gray-300 rounded-full left-0 top-2" />
                        <div className="absolute w-20 h-14 bg-white dark:bg-gray-300 rounded-full left-8 top-0" />
                        <div className="absolute w-14 h-10 bg-white dark:bg-gray-300 rounded-full left-16 top-3" />
                    </div>

                    {/* Nuvem 2 */}
                    <div
                        className="absolute w-36 h-18 md:w-44 md:h-22 opacity-70"
                        style={{
                            top: '40%',
                            animation: 'clouds-move-2 40s linear infinite',
                            animationDelay: '-10s'
                        }}
                    >
                        <div className="absolute w-18 h-14 bg-white dark:bg-gray-400 rounded-full left-0 top-2" />
                        <div className="absolute w-22 h-16 bg-white dark:bg-gray-400 rounded-full left-10 top-0" />
                        <div className="absolute w-16 h-12 bg-white dark:bg-gray-400 rounded-full left-20 top-3" />
                    </div>

                    {/* Nuvem 3 */}
                    <div
                        className="absolute w-28 h-14 md:w-36 md:h-18 opacity-60"
                        style={{
                            top: '60%',
                            animation: 'clouds-move-3 35s linear infinite',
                            animationDelay: '-20s'
                        }}
                    >
                        <div className="absolute w-14 h-10 bg-white dark:bg-gray-500 rounded-full left-0 top-2" />
                        <div className="absolute w-18 h-12 bg-white dark:bg-gray-500 rounded-full left-8 top-0" />
                        <div className="absolute w-12 h-9 bg-white dark:bg-gray-500 rounded-full left-16 top-2" />
                    </div>
                </div>
            )}

            {/* CHUVA */}
            {(condition === 'rain' || condition === 'thunderstorm') && (
                <div className="absolute inset-0">
                    {[...Array(80)].map((_, i) => {
                        const width = Math.random() * 0.7 + 0.8 // 0.8-1.5px
                        const opacity = Math.random() * 0.3 + 0.4 // 0.4-0.7
                        const height = Math.random() * 12 + 8 // 8-20px
                        const speed = 0.25 + Math.random() * 0.35 // 0.25-0.6s

                        return (
                            <div
                                key={i}
                                className="absolute bg-gradient-to-b from-blue-100 to-transparent"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    width: `${width}px`,
                                    height: `${height}px`,
                                    opacity,
                                    filter: 'blur(0.5px)',
                                    borderRadius: '50%',
                                    animation: `rain-fall ${speed}s linear infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            />
                        )
                    })}
                </div>
            )}

            {/* RAIOS */}
            {condition === 'thunderstorm' && (
                <>
                    <div
                        className="absolute inset-0"
                        style={{ animation: 'lightning-bg 8s linear infinite' }}
                    />
                    <div
                        className="absolute top-0 left-1/4 w-1 h-32 bg-yellow-200"
                        style={{
                            animation: 'lightning-flash 8s linear infinite',
                            clipPath: 'polygon(50% 0%, 40% 40%, 55% 40%, 45% 100%, 65% 55%, 50% 55%)'
                        }}
                    />
                    <div
                        className="absolute top-0 right-1/3 w-1 h-28 bg-yellow-100"
                        style={{
                            animation: 'lightning-flash 8s linear infinite',
                            animationDelay: '4s',
                            clipPath: 'polygon(50% 0%, 40% 40%, 55% 40%, 45% 100%, 65% 55%, 50% 55%)'
                        }}
                    />
                </>
            )}

            {/* NEVE */}
            {condition === 'snow' && (
                <div className="absolute inset-0">
                    {[...Array(40)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full opacity-80"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animation: `snow-fall ${2 + Math.random() * 3}s linear infinite, snow-sway ${1 + Math.random()}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 3}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* NÉVOA */}
            {condition === 'mist' && (
                <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-full h-32 bg-gray-400 opacity-20"
                            style={{
                                top: `${i * 20}%`,
                                animation: `mist-float ${8 + i * 2}s ease-in-out infinite`,
                                animationDelay: `${i * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
