import React, { useEffect, useRef, useState } from 'react';
import { CURRICULUM_TRACKS } from '../../data/curriculum';
import { LessonViewer } from './LessonViewer';

const lessons = CURRICULUM_TRACKS.flatMap(track => track.lessons);
const lessonIds = new Set(lessons.map(lesson => lesson.id));

export const CurriculumSection: React.FC = () => {
  const lessonPanel = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('assured_completed_lessons') || '[]');
      return Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === 'string' && lessonIds.has(id)))] : [];
    } catch { return []; }
  });
  const [storageNotice, setStorageNotice] = useState('');
  useEffect(() => {
    try { localStorage.setItem('assured_completed_lessons', JSON.stringify(completed)); }
    catch { setStorageNotice('Progress is available for this visit, but cannot be saved on this device.'); }
  }, [completed]);
  useEffect(() => { if (activeId) lessonPanel.current?.focus(); }, [activeId]);
  const activeTrack = CURRICULUM_TRACKS.find(track => track.lessons.some(lesson => lesson.id === activeId));
  const activeLesson = activeTrack?.lessons.find(lesson => lesson.id === activeId);
  const nextLesson = activeLesson ? lessons[lessons.findIndex(lesson => lesson.id === activeLesson.id) + 1] : undefined;

  return (
    <section id="curriculum" aria-labelledby="curriculum-heading" className="mt-12 scroll-mt-6">
      <h2 id="curriculum-heading" className="text-3xl font-semibold">Curriculum</h2>
      <p className="mt-3 text-slate-400">Four learning tracks, from stem-cell foundations to interpreting sequencing results. Choose a lesson, read the material, and check your understanding with its quiz.</p>
      <p className="mt-3 text-sm text-emerald-300" role="status">{completed.length} of {lessons.length} lesson quizzes completed · {storageNotice ? "Progress for this visit" : "Progress saved on this device"}</p>
      {storageNotice && <p role="status" className="mt-2 text-sm text-amber-300">{storageNotice}</p>}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {CURRICULUM_TRACKS.map(track => (
          <article key={track.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-widest text-emerald-300">Track {track.trackNumber}</p>
            <h3 className="mt-2 text-xl font-semibold">{track.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{track.subtitle}</p>
            <ol className="mt-5 space-y-2">
              {track.lessons.map(lesson => (
                <li key={lesson.id}>
                  <button type="button" aria-pressed={activeId === lesson.id} onClick={() => setActiveId(lesson.id)}
                    className={`w-full rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-cyan-400 ${activeId === lesson.id ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-700 hover:border-slate-500'}`}>
                    <span className="block text-sm font-medium">{lesson.title}</span>
                    <span className="mt-1 block text-xs text-slate-400">{lesson.duration} · {completed.includes(lesson.id) ? 'Quiz completed' : 'Read lesson and take quiz'}</span>
                  </button>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {activeLesson && activeTrack ? (
        <div ref={lessonPanel} tabIndex={-1} aria-label="Selected lesson" className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-emerald-300">Track {activeTrack.trackNumber} · {activeTrack.title}</p>
            <button type="button" onClick={() => setActiveId(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-cyan-400">Close lesson</button>
          </div>
          <LessonViewer key={activeLesson.id} lesson={activeLesson} trackColor={activeTrack.color}
            isCompleted={completed.includes(activeLesson.id)}
            onPassQuiz={id => setCompleted(current => current.includes(id) ? current : [...current, id])}
            onNextLesson={nextLesson ? () => setActiveId(nextLesson.id) : undefined} />
        </div>
      ) : <p className="mt-6 text-sm text-slate-400">Select a lesson above to start learning.</p>}
    </section>
  );
};
