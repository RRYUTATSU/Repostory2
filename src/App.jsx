import { useEffect, useState } from 'react'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'

const COLUMNS = [
  { id: 'todo', title: 'To do', subtitle: 'Ready when you are', tone: 'lavender', icon: Circle },
  { id: 'inProgress', title: 'In progress', subtitle: 'Work in motion', tone: 'blue', icon: Clock3 },
  { id: 'done', title: 'Completed', subtitle: 'Look at you go', tone: 'green', icon: CheckCircle2 },
]

const PRIORITIES = {
  low: { label: 'Low', tone: 'low' },
  medium: { label: 'Medium', tone: 'medium' },
  high: { label: 'High', tone: 'high' },
}

const INITIAL_TASKS = [
  { id: '1', title: 'Design mockups', description: 'Create UI designs for the new feature', priority: 'high', dueDate: '2026-10-15', status: 'todo' },
  { id: '2', title: 'Setup project', description: 'Initialize the project structure', priority: 'medium', dueDate: '', status: 'done' },
  { id: '3', title: 'Write documentation', description: 'Document the API endpoints', priority: 'low', dueDate: '2026-10-20', status: 'inProgress' },
]

function parseDueDate(value) {
  if (!value) return null
  return new Date(value.includes('T') ? value : `${value}T12:00:00`)
}

function formatDueDate(value) {
  const date = parseDueDate(value)
  if (!date) return ''
  const formattedDate = date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  if (!value.includes('T')) return formattedDate
  return `${formattedDate} · ${date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}`
}

function getDueTimeParts(value) {
  if (!value?.includes('T')) return { hour: '', minute: '00', period: 'AM' }
  const [hours, minutes] = value.split('T')[1].split(':')
  const numericHour = Number(hours)
  return {
    hour: String(numericHour % 12 || 12),
    minute: minutes,
    period: numericHour >= 12 ? 'PM' : 'AM',
  }
}

function SortableTask({ task, onEdit, onDelete, isRecentlyMoved, onArrivalAnimationEnd }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 1 : undefined,
  }
  const priority = PRIORITIES[task.priority] || PRIORITIES.medium

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onAnimationEnd={isRecentlyMoved ? onArrivalAnimationEnd : undefined}
      className={`task-card${task.status === 'done' ? ' task-card-done' : ''}${isDragging ? ' task-card-dragging' : ''}${isRecentlyMoved ? ' task-card-arriving' : ''}`}
    >
      <div className="task-card-top">
        <span className={`priority-pill priority-${priority.tone}`}>
          <span className="priority-dot" />
          {priority.label}
        </span>
        <div className="task-actions">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            title="Edit task"
          >
            <span className="sr-only">Edit task</span>
            <ArrowUpRight size={16} />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={() => onDelete(task.id)}
            aria-label={`Delete ${task.title}`}
            title="Delete task"
          >
            <span className="sr-only">Delete task</span>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <h3>{task.title}</h3>
      {task.description && <p className="task-description">{task.description}</p>}
      {task.dueDate && (
        <div className="task-due">
          <CalendarDays size={14} />
          <span>{formatDueDate(task.dueDate)}</span>
        </div>
      )}
    </article>
  )
}

function Column({ column, tasks, onEdit, onDelete, onAddTask, recentlyMovedTaskId, onArrivalAnimationEnd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const Icon = column.icon

  return (
    <section className={`board-column column-${column.tone}${isOver ? ' column-over' : ''}`} ref={setNodeRef}>
      <div className="column-heading">
        <div className="column-title-wrap">
          <span className="column-icon"><Icon size={16} /></span>
          <h2>{column.title}</h2>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button type="button" className="column-add" onClick={() => onAddTask(column.id)} aria-label={`Add task to ${column.title}`}>
          <Plus size={17} />
        </button>
      </div>
      <p className="column-subtitle">{column.subtitle}</p>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              isRecentlyMoved={task.id === recentlyMovedTaskId}
              onArrivalAnimationEnd={() => onArrivalAnimationEnd(task.id)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="empty-column">
              <span className="empty-icon"><ListTodo size={19} /></span>
              <span>No tasks here yet</span>
            </div>
          )}
        </div>
      </SortableContext>
      <button type="button" className="add-task-link" onClick={() => onAddTask(column.id)}>
        <Plus size={16} />
        Add a task
      </button>
    </section>
  )
}

function TaskModal({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate?.split('T')[0] || '')
  const initialTime = getDueTimeParts(task?.dueDate)
  const [dueHour, setDueHour] = useState(initialTime.hour)
  const [dueMinute, setDueMinute] = useState(initialTime.minute)
  const [duePeriod, setDuePeriod] = useState(initialTime.period)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    let scheduledDate = dueDate
    if (dueDate && dueHour) {
      const hour = Number(dueHour) % 12 + (duePeriod === 'PM' ? 12 : 0)
      scheduledDate = `${dueDate}T${String(hour).padStart(2, '0')}:${dueMinute}`
    }
    onSave({ ...task, title: title.trim(), description: description.trim(), priority, dueDate: scheduledDate })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{task?.title ? 'MAKE IT BETTER' : 'GET IT STARTED'}</span>
            <h2 id="modal-title">{task?.title ? 'Edit task' : 'New task'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close dialog"><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="task-title">Task name</label>
          <input
            id="task-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to get done?"
            required
          />
          <label className="field-label" htmlFor="task-description">A few details <span>Optional</span></label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a little context..."
            rows="3"
          />
          <div className="form-row">
            <div>
              <label className="field-label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="task-date">Due date <span>Optional</span></label>
              <input id="task-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              <label className="field-label time-label" htmlFor="task-hour">Time <span>Optional</span></label>
              <div className="time-picker">
                <select id="task-hour" value={dueHour} disabled={!dueDate} onChange={(event) => setDueHour(event.target.value)} aria-label="Hour">
                  <option value="">Hour</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                    <option key={hour} value={String(hour)}>{hour}</option>
                  ))}
                </select>
                <select value={dueMinute} disabled={!dueDate || !dueHour} onChange={(event) => setDueMinute(event.target.value)} aria-label="Minute">
                  {Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
                <select value={duePeriod} disabled={!dueDate || !dueHour} onChange={(event) => setDuePeriod(event.target.value)} aria-label="AM or PM">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Save task</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function App() {
  const [today] = useState(() => new Date())
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks')
    return saved ? JSON.parse(saved) : INITIAL_TASKS
  })
  const [modalTask, setModalTask] = useState(null)
  const [modalColumn, setModalColumn] = useState(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState(null)

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const movedTask = tasks.find((task) => task.id === active.id)
    if (!movedTask) return

    const targetTask = tasks.find((task) => task.id === over.id)
    const targetColumn = COLUMNS.find((column) => column.id === over.id)?.id || targetTask?.status
    if (targetColumn && movedTask.status !== targetColumn) {
      setRecentlyMovedTaskId(active.id)
      setTasks((current) => current.map((task) => task.id === active.id ? { ...task, status: targetColumn } : task))
    }
  }

  const handleAddTask = (columnId) => {
    setModalColumn(columnId)
    setModalTask({ id: Date.now().toString(), status: columnId })
  }

  const handleSaveTask = (task) => {
    if (modalColumn && !tasks.some((item) => item.id === task.id)) {
      setTasks((current) => [...current, task])
    } else {
      setTasks((current) => current.map((item) => item.id === task.id ? task : item))
    }
    setModalTask(null)
    setModalColumn(null)
  }

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (priorityFilter === 'all' || task.priority === priorityFilter)
  })
  const completedCount = tasks.filter((task) => task.status === 'done').length
  const activeCount = tasks.length - completedCount
  const weekAhead = new Date(today)
  weekAhead.setDate(today.getDate() + 7)
  weekAhead.setHours(23, 59, 59, 999)
  const dueThisWeek = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'done') return false
    const due = task.dueDate.includes('T') ? new Date(task.dueDate) : new Date(`${task.dueDate}T00:00:00`)
    return due >= new Date(today.toDateString()) && due <= weekAhead
  }).length

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daymark home">
          <span className="brand-mark"><Check size={19} strokeWidth={2.7} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="workspace-label"><span className="workspace-dot" /> Personal workspace</span>
          <span className="avatar" aria-label="Your profile">R</span>
        </div>
      </header>

      <div className="page-content">
        <section className="welcome-row">
          <div>
            <p className="date-label">{today.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1>A little progress <span>goes a long way.</span></h1>
            <p className="welcome-copy">Make space for what matters. Your next great day starts here.</p>
          </div>
          <button type="button" className="button button-primary new-task-button" onClick={() => handleAddTask('todo')}>
            <Plus size={18} />
            New task
          </button>
        </section>

        <section className="overview" aria-label="Task overview">
          <div className="overview-card overview-total">
            <span className="overview-icon"><LayoutDashboard size={18} /></span>
            <div><span className="overview-value">{activeCount}</span><span className="overview-label">Open tasks</span></div>
            <span className="overview-note">in your board</span>
          </div>
          <div className="overview-card overview-due">
            <span className="overview-icon"><CalendarDays size={18} /></span>
            <div><span className="overview-value">{dueThisWeek}</span><span className="overview-label">Due this week</span></div>
            <span className="overview-note">coming up</span>
          </div>
          <div className="overview-card overview-done">
            <span className="overview-icon"><CheckCircle2 size={18} /></span>
            <div><span className="overview-value">{completedCount}</span><span className="overview-label">Completed</span></div>
            <span className="overview-note"><Sparkles size={13} /> nice work</span>
          </div>
        </section>

        <section className="board-section">
          <div className="board-toolbar">
            <div className="board-heading">
              <h2>My board</h2>
              <span className="board-total">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
            </div>
            <div className="board-controls">
              <label className="search-box">
                <Search size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a task..." aria-label="Search tasks" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
              </label>
              <label className="filter-box">
                <span>Priority</span>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter by priority">
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="board-grid">
              {COLUMNS.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  tasks={visibleTasks.filter((task) => task.status === column.id)}
                  onEdit={(task) => { setModalTask(task); setModalColumn(null) }}
                  onDelete={(id) => setTasks((current) => current.filter((task) => task.id !== id))}
                  onAddTask={handleAddTask}
                  recentlyMovedTaskId={recentlyMovedTaskId}
                  onArrivalAnimationEnd={(id) => setRecentlyMovedTaskId((current) => current === id ? null : current)}
                />
              ))}
            </div>
          </DndContext>
          <p className="board-hint">Tip: drag a task to move it between columns.</p>
        </section>
        <footer className="page-footer"><span>One thing at a time.</span><span>You've got this <span className="footer-heart">♥</span></span></footer>
      </div>
      {modalTask && (
        <TaskModal
          task={modalTask}
          onSave={handleSaveTask}
          onCancel={() => { setModalTask(null); setModalColumn(null) }}
        />
      )}
    </main>
  )
}
