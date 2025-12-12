'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth'
import { ref, set, get, child } from 'firebase/database'
import { auth, db } from '@/lib/firebase/config'
import { User } from '@/types'

interface AuthContextType {
    user: FirebaseUser | null
    userData: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, name: string, role?: 'admin' | 'user') => Promise<void>
    signOut: () => Promise<void>
    isAdmin: boolean
    isUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [userData, setUserData] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                // Buscar dados do usuário no Realtime Database
                try {
                    const userRef = ref(db, `users/${firebaseUser.uid}`)
                    const snapshot = await get(userRef)

                    if (snapshot.exists()) {
                        setUserData(snapshot.val() as User)
                    }
                } catch (error) {
                    console.error('Erro ao buscar dados do usuário:', error)
                }
            } else {
                setUserData(null)
            }

            setLoading(false)
        })

        return unsubscribe
    }, [])

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password)
    }

    const signUp = async (
        email: string,
        password: string,
        name: string,
        role: 'admin' | 'user' = 'user'
    ) => {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)

        // Criar dados do usuário no Realtime Database
        const userDataToSave: Partial<User> = {
            uid: newUser.uid,
            email: email,
            name,
            role,
            profileCompleted: true, // Perfil já completo
            createdAt: new Date(),
            isActive: true,
        }

        await set(ref(db, `users/${newUser.uid}`), userDataToSave)
    }

    const signOut = async () => {
        await firebaseSignOut(auth)
        setUserData(null)
    }

    const isAdmin = userData?.role === 'admin'
    const isUser = userData?.role === 'user'

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                loading,
                signIn,
                signUp,
                signOut,
                isAdmin,
                isUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
