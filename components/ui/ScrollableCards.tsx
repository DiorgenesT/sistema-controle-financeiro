'use client'

import { ReactNode, useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScrollableCardsProps {
    children: ReactNode
    className?: string
}

export function ScrollableCards({ children, className = '' }: ScrollableCardsProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const checkScroll = () => {
        if (!scrollRef.current) return

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [children])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return

        const scrollAmount = 300
        const newPosition = direction === 'left'
            ? scrollRef.current.scrollLeft - scrollAmount
            : scrollRef.current.scrollLeft + scrollAmount

        scrollRef.current.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        })
    }

    return (
        <div className="relative group">
            {/* Seta Esquerda */}
            {isMounted && canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Scroll para esquerda"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
            )}

            {/* Container com scroll */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={`flex gap-5 overflow-x-auto pb-4 px-2 scrollbar-none ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {/* Seta Direita */}
            {isMounted && canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Scroll para direita"
                >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
            )}
        </div>
    )
}
