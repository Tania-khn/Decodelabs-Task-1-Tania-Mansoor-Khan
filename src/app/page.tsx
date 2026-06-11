'use client'

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX,
  Eye, EyeOff, Copy, Check, RefreshCw,
  Lock, AlertTriangle, CheckCircle2, XCircle,
  KeyRound, Fingerprint, Clock, Zap, ArrowRight, ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// --- Types ---
type StrengthLevel = 'none' | 'weak' | 'medium' | 'strong' | 'very-strong'

interface PasswordAnalysis {
  length: number
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumbers: boolean
  hasSymbols: boolean
  strength: StrengthLevel
  score: number
  entropy: number
  crackTime: string
  isCommon: boolean
  suggestions: string[]
}

// --- Common/Leaked Passwords Database ---
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123', 'batman',
  'admin', 'login', 'princess', 'qwerty123', 'welcome', 'hello', 'charlie',
  'donald', 'whatever', '1234567890', 'access', 'thunder', '1q2w3e4r',
  'computer', 'jordan', 'matrix', 'freedom', 'pass', 'test', 'pass123',
  'root', 'toor', '1q2w3e', '1234', '12345', '123456789', 'letmein1',
])

// --- Password Analysis Logic ---
function analyzePassword(password: string): PasswordAnalysis {
  if (!password) {
    return {
      length: 0,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSymbols: false,
      strength: 'none',
      score: 0,
      entropy: 0,
      crackTime: '-',
      isCommon: false,
      suggestions: ['Enter a password to begin analysis'],
    }
  }

  const length = password.length
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSymbols = /[^A-Za-z0-9]/.test(password)
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase())

  // Calculate character space (entropy source)
  let charSpace = 0
  if (hasLowercase) charSpace += 26
  if (hasUppercase) charSpace += 26
  if (hasNumbers) charSpace += 10
  if (hasSymbols) charSpace += 33

  // Calculate entropy
  const entropy = length > 0 ? Math.round(length * Math.log2(Math.max(charSpace, 1))) : 0

  // Calculate score (0-100)
  let score = 0

  // Length scoring (up to 30 points)
  if (length >= 8) score += 10
  if (length >= 12) score += 10
  if (length >= 16) score += 10

  // Character variety scoring (up to 40 points)
  if (hasLowercase) score += 10
  if (hasUppercase) score += 10
  if (hasNumbers) score += 10
  if (hasSymbols) score += 10

  // Bonus for mixed character types (up to 20 points)
  const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length
  if (varietyCount >= 3) score += 10
  if (varietyCount === 4) score += 10

  // Length bonus (up to 10 points)
  if (length > 20) score += 10

  // Penalties
  if (isCommon) score = Math.min(score, 15)
  if (length < 6) score = Math.min(score, 25)

  // Sequential/repeated characters penalty
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)
  const hasRepeated = /(.)\1{2,}/.test(password)
  if (hasSequential) score = Math.max(0, score - 10)
  if (hasRepeated) score = Math.max(0, score - 10)

  // Determine strength level
  let strength: StrengthLevel
  if (score <= 25) strength = 'weak'
  else if (score <= 50) strength = 'medium'
  else if (score <= 75) strength = 'strong'
  else strength = 'very-strong'

  // Estimate crack time
  const crackTime = estimateCrackTime(entropy, isCommon)

  // Generate suggestions
  const suggestions: string[] = []
  if (isCommon) suggestions.push('This is a commonly known password — avoid using it')
  if (length < 8) suggestions.push('Use at least 8 characters for better security')
  if (length < 12 && length >= 8) suggestions.push('Consider using 12+ characters for stronger protection')
  if (!hasUppercase) suggestions.push('Add uppercase letters (A-Z)')
  if (!hasLowercase) suggestions.push('Add lowercase letters (a-z)')
  if (!hasNumbers) suggestions.push('Include numbers (0-9)')
  if (!hasSymbols) suggestions.push('Add special characters (!@#$%^&*)')
  if (hasSequential) suggestions.push('Avoid sequential characters (abc, 123)')
  if (hasRepeated) suggestions.push('Avoid repeating the same character')
  if (suggestions.length === 0) suggestions.push('Excellent! Your password meets all security criteria')

  return {
    length,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    strength,
    score,
    entropy,
    crackTime,
    isCommon,
    suggestions,
  }
}

function estimateCrackTime(entropy: number, isCommon: boolean): string {
  if (isCommon) return 'Instant (< 1 second)'
  if (entropy === 0) return '-'

  // Assume 10 billion guesses per second (modern hardware)
  const guessesPerSecond = 10_000_000_000
  const totalGuesses = Math.pow(2, entropy)
  const seconds = totalGuesses / guessesPerSecond / 2 // Average case

  if (seconds < 1) return 'Instant (< 1 second)'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`
  if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000 / 100) * 100} years`
  if (seconds < 31536000 * 1000000) return `${Math.round(seconds / 31536000 / 1000) * 1000}+ years`
  return 'Centuries+'
}

function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + symbols
  const length = 16 + Math.floor(Math.random() * 5)

  let password = ''
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// --- Strength Config ---
const strengthConfig: Record<StrengthLevel, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  icon: typeof Shield
  progressColor: string
}> = {
  none: {
    label: 'No Password',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted',
    textColor: 'text-muted-foreground',
    icon: Shield,
    progressColor: 'bg-muted-foreground',
  },
  weak: {
    label: 'Weak',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-600',
    icon: ShieldX,
    progressColor: 'bg-red-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600',
    icon: ShieldAlert,
    progressColor: 'bg-amber-500',
  },
  strong: {
    label: 'Strong',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-600',
    icon: ShieldCheck,
    progressColor: 'bg-emerald-500',
  },
  'very-strong': {
    label: 'Very Strong',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    borderColor: 'border-emerald-600/30',
    textColor: 'text-emerald-700',
    icon: ShieldCheck,
    progressColor: 'bg-emerald-600',
  },
}

// --- Main Component ---
export default function PasswordStrengthChecker() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [showApp, setShowApp] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<Array<{ password: string; strength: StrengthLevel; timestamp: string }>>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [fingerprintScanning, setFingerprintScanning] = useState(false)
  const [fingerprintDone, setFingerprintDone] = useState(false)
  const inputRef = useState<HTMLInputElement | null>(null)

  const analysis = useMemo(() => analyzePassword(password), [password])

  const config = strengthConfig[analysis.strength]
  const StrengthIcon = config.icon

  const handleCheck = useCallback(() => {
    if (password && analysis.strength !== 'none') {
      setHistory(prev => [
        { password: showPassword ? password : '•'.repeat(password.length), strength: analysis.strength, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ])
    }
  }, [password, analysis.strength, showPassword])

  const handleCopy = useCallback(async () => {
    if (password) {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [password])

  const handleGenerate = useCallback(() => {
    const newPass = generateSecurePassword()
    setPassword(newPass)
    setShowPassword(true)
  }, [])

  const handleClear = useCallback(() => {
    setPassword('')
    setShowPassword(false)
  }, [])

  const criteriaItems = [
    { label: 'Length ≥ 8 characters', met: analysis.length >= 8, detail: analysis.length > 0 ? `(${analysis.length} chars)` : '' },
    { label: 'Uppercase letters (A-Z)', met: analysis.hasUppercase, detail: '' },
    { label: 'Lowercase letters (a-z)', met: analysis.hasLowercase, detail: '' },
    { label: 'Numbers (0-9)', met: analysis.hasNumbers, detail: '' },
    { label: 'Special characters (!@#$...)', met: analysis.hasSymbols, detail: '' },
  ]

  // --- Landing Page ---
  if (mounted && !showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyan-500/5 rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center text-center px-6 z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative">
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
                <img
                  src="/cyber-logo.png"
                  alt="Cybersecurity Logo"
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full animate-pulse" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </motion.div>

          {/* Main Title - Bold */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4"
          >
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Secure Your Digital Future
            </span>
            <br />
            <span className="text-white">
              with Tania
            </span>
          </motion.h1>

          {/* Subtitle - Normal */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg sm:text-xl text-slate-400 font-normal mb-10"
          >
            Stay Safe And Secure
          </motion.p>

          {/* Fingerprint Scan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-8"
          >
            <button
              onClick={() => {
                if (fingerprintScanning || fingerprintDone) return
                setFingerprintScanning(true)
                setTimeout(() => {
                  setFingerprintScanning(false)
                  setFingerprintDone(true)
                }, 2000)
              }}
              className="group relative flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                fingerprintDone
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30'
                  : fingerprintScanning
                    ? 'bg-cyan-500/10 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 animate-pulse'
                    : 'bg-slate-800/50 border-2 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5'
              }`}>
                <Fingerprint className={`w-10 h-10 transition-all duration-500 ${
                  fingerprintDone
                    ? 'text-emerald-400'
                    : fingerprintScanning
                      ? 'text-cyan-400 animate-pulse'
                      : 'text-slate-500 group-hover:text-emerald-400'
                }`} />
                {/* Scan line animation */}
                {fingerprintScanning && (
                  <motion.div
                    initial={{ top: '10%' }}
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
                  />
                )}
                {/* Done checkmark */}
                {fingerprintDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors duration-300 ${
                fingerprintDone ? 'text-emerald-400' : fingerprintScanning ? 'text-cyan-400' : 'text-slate-500 group-hover:text-emerald-300'
              }`}>
                {fingerprintDone ? 'Verified' : fingerprintScanning ? 'Scanning...' : 'Scan Fingerprint'}
              </span>
            </button>
          </motion.div>

          {/* Get Started Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            <Button
              onClick={() => setShowApp(true)}
              size="lg"
              className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="mt-16"
          >
            <ChevronDown className="w-6 h-6 text-slate-500 animate-bounce" />
          </motion.div>
        </motion.div>

        {/* Bottom text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 text-xs text-slate-600"
        >
          Cybersecurity by Tania&apos;s
        </motion.div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-400 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Password Strength Checker</h1>
            <p className="text-xs text-slate-400">Cybersecurity by Tania&apos;s • Project 1</p>
          </div>
         
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3 py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => {
                if (!password) {
                  setAnalyzing(true)
                  const input = document.querySelector('input[type="text"], input[type="password"]') as HTMLInputElement
                  if (input) input.focus()
                  setTimeout(() => setAnalyzing(false), 1500)
                } else {
                  setAnalyzing(true)
                  setTimeout(() => setAnalyzing(false), 1000)
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 cursor-pointer transition-all duration-300 ${
                analyzing
                  ? 'bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30'
              }`}
            >
              <Fingerprint className={`w-4 h-4 transition-all duration-300 ${analyzing ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
              <span className={`text-sm font-medium transition-colors duration-300 ${analyzing ? 'text-emerald-200' : 'text-emerald-300'}`}>
                {analyzing ? (password ? 'Analyzing...' : 'Ready to Analyze') : 'Security Logic Analyzer'}
              </span>
            </button>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Analyze Your Password Strength
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Evaluate risk through string-handling and conditional logic. Master the fundamental principles of data validation and entropy.
          </p>
        </div>

        {/* Password Input Card */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-emerald-400" />
              Enter Password
            </CardTitle>
            <CardDescription className="text-slate-400">
              Type or generate a password to analyze its strength
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password here..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-24 h-12 text-base bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-slate-600"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                  disabled={!password}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerate}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Strong Password
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={handleCheck}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 ml-auto"
                disabled={!password}
              >
                Save to History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        <AnimatePresence>
          {password && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {/* Strength Result Card */}
              <Card className={`border-slate-800/50 bg-slate-900/50 backdrop-blur-sm lg:col-span-2 ${analysis.isCommon ? 'ring-2 ring-red-500/30' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StrengthIcon className={`w-5 h-5 ${config.color}`} />
                    Strength Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Strength Badge & Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        key={analysis.strength}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`px-4 py-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}
                      >
                        <span className={`font-bold text-lg ${config.textColor}`}>
                          {config.label}
                        </span>
                      </motion.div>
                      {analysis.isCommon && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500 font-medium text-sm">Leaked Password!</span>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-3xl font-bold text-white">{analysis.score}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Security Score</span>
                      <span>{analysis.score}/100</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.score}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${config.progressColor}`}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <KeyRound className="w-3 h-3" />
                        Entropy
                      </div>
                      <p className="text-lg font-bold text-white">{analysis.entropy}</p>
                      <p className="text-xs text-slate-500">bits</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        Crack Time
                      </div>
                      <p className="text-sm font-bold text-white leading-tight">{analysis.crackTime}</p>
                      <p className="text-xs text-slate-500">est. brute force</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <Fingerprint className="w-3 h-3" />
                        Length
                      </div>
                      <p className="text-lg font-bold text-white">{analysis.length}</p>
                      <p className="text-xs text-slate-500">characters</p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {analysis.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Suggestions
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            {analysis.strength === 'very-strong' && !analysis.isCommon ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            )}
                            <span className={analysis.strength === 'very-strong' && !analysis.isCommon ? 'text-emerald-300' : 'text-slate-300'}>
                              {suggestion}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Criteria Checklist Card */}
              <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Criteria Check
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Password requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {criteriaItems.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                          item.met
                            ? 'bg-emerald-500/5 border border-emerald-500/20'
                            : 'bg-slate-800/30 border border-slate-700/20'
                        }`}
                      >
                        {item.met ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className={`text-sm ${item.met ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {item.label}
                        </span>
                        {item.detail && (
                          <span className="ml-auto text-xs text-slate-500">{item.detail}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <Separator className="my-4 bg-slate-800" />

                  {/* Character Distribution */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Character Types Used</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`px-3 py-2 rounded-md text-center text-xs font-medium ${
                        analysis.hasUppercase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/30 text-slate-600 border border-slate-700/20'
                      }`}>
                        A-Z
                      </div>
                      <div className={`px-3 py-2 rounded-md text-center text-xs font-medium ${
                        analysis.hasLowercase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/30 text-slate-600 border border-slate-700/20'
                      }`}>
                        a-z
                      </div>
                      <div className={`px-3 py-2 rounded-md text-center text-xs font-medium ${
                        analysis.hasNumbers ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/30 text-slate-600 border border-slate-700/20'
                      }`}>
                        0-9
                      </div>
                      <div className={`px-3 py-2 rounded-md text-center text-xs font-medium ${
                        analysis.hasSymbols ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/30 text-slate-600 border border-slate-700/20'
                      }`}>
                        !@#$
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Info Card */}
        {!password && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Ready to Analyze</h3>
                <p className="text-slate-400 max-w-md mx-auto text-sm">
                  Enter a password above or generate a secure one. We will check its length, character variety, entropy, and estimate how long it would take to crack.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Weak
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Medium
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Strong
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Very Strong
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-emerald-400" />
                Check History
              </CardTitle>
              <CardDescription className="text-slate-400">
                Previously analyzed passwords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((item, i) => {
                  const hConfig = strengthConfig[item.strength]
                  const HIcon = hConfig.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/20"
                    >
                      <HIcon className={`w-4 h-4 ${hConfig.color} shrink-0`} />
                      <code className="text-sm text-slate-300 font-mono flex-1 truncate">{item.password}</code>
                      <Badge variant="outline" className={`${hConfig.borderColor} ${hConfig.textColor} text-xs`}>
                        {hConfig.label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {item.timestamp}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Use 12+ Characters', desc: 'Longer passwords exponentially increase the number of possible combinations, making brute force attacks impractical.' },
                { title: 'Mix Character Types', desc: 'Combine uppercase, lowercase, numbers, and symbols to maximize the character space and entropy of your password.' },
                { title: 'Avoid Common Passwords', desc: 'Passwords like "123456" or "password" appear in leaked databases and are the first ones attackers try.' },
                { title: 'Use Unique Passwords', desc: 'Never reuse passwords across accounts. A breach on one service should not compromise your other accounts.' },
                { title: 'Check for Leaks', desc: 'Use services like Have I Been Pwned to verify if your password has appeared in known data breaches.' },
                { title: 'Use a Password Manager', desc: 'Password managers generate and store complex, unique passwords for each of your accounts securely.' },
              ].map((tip, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20 space-y-1">
                  <h4 className="text-sm font-medium text-emerald-400">{tip.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Cybersecurity by Tania&apos;s • Project 1
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Password Strength Checker</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
