'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const tabs = [
  {
    color: 'bg-yellow-400',
    title: 'AI-powered',
    body: (
      <>
        GENERATE CUSTOMIZED, HIGH-QUALITY FLASHCARDS AND QUIZZES FROM ANY TOPIC OR YOUR NOTES.
      </>
    ),
  },
  {
    color: 'bg-pink-200',
    title: 'Multiple Study Modes',
    body: (
      <>
        STUDY WITH FLASHCARDS, TEST YOURSELF WITH QUIZZES, AND TRACK YOUR PROGRESS.
      </>
    ),
  },
  {
    color: 'bg-sky-200',
    title: 'Organized Library',
    body: (
      <>
        KEEP ALL YOUR STUDY SETS ORGANIZED AND EASILY ACCESSIBLE IN YOUR PERSONAL LIBRARY.
      </>
    ),
  },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0)
  const active = tabs[activeTab]

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center px-10 py-40 pb-48">

        <Image
          src="/star.png"
          alt="star"
          width={64}
          height={64}
          className="absolute top-28 left-[34%]"
        />
        <Image
          src="/star.png"
          alt="star"
          width={64}
          height={64}
          className="absolute top-36 left-[40%] rotate-12"
        />


        <div className="bg-white rounded-2xl border border-primary shadow-sm p-14 max-w-2xl w-full mt-4">
          <h1 className="font-display text-6xl text-primary leading-tight mb-5">
            Studying just got easier.
          </h1>
          <p className="text-[12px] tracking-widest text-primary mb-1 uppercase">
            CREATE AI POWERED FLASHCARDS &amp; QUIZZES FROM{' '}
            <span className="bg-yellow-300 px-1.5 py-0.5 rounded">YOUR NOTES.</span>
          </p>
          <p className="text-[12px] tracking-widest text-primary uppercase">
            STUDY SMARTER, NOT HARDER.
          </p>
          <Link
            href="/create/flashcards/select"
            className="mt-7 inline-block bg-primary text-white rounded-full px-6 py-3 text-[12px] tracking-wider hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            LET'S GO! →
          </Link>
        </div>
      </section>

      {/* ── FOLDER ── */}
      <section className="relative">
        {/* Folder tabs */}
        <div className="flex pl-12 items-end">
          {tabs.map((tab, i) => (
            <button
              key={tab.title}
              onClick={() => setActiveTab(i)}
              className={`
    w-48 rounded-t-xl tracking-wider text-primary transition-all duration-200 ${tab.color}
    ${i === activeTab ? 'h-16' : ' h-12 hover:h-16'}
  `}
            >
            </button>
          ))}
        </div>

        {/* Folder body */}
        <div className={`${active.color} px-10 py-32 min-h-[360px] rounded-t-2xl`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-xl p-12 shadow-sm max-w-lg mx-auto border border-primary">
              {/* Tape */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#d4bfa0] opacity-70 rounded" />
              <h3 className="font-mono font-bold text-xs tracking-wide text-primary mt-2 mb-3">
                {active.title}
              </h3>
              <p className="text-[9px] tracking-widest leading-loose text-primary uppercase">
                {active.body}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}