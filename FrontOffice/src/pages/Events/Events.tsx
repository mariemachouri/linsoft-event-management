import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, LayoutList, Search, SlidersHorizontal, X } from 'lucide-react';
import EventCard from '../../components/EventCard/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { eventsService } from '../../services/events.service';
import type { Event, EventCategory, EventStatus } from '../../types';
import './Events.css';

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'ALL',        label: 'All',          emoji: '✨' },
  { key: 'CONFERENCE', label: 'Conferences',  emoji: '🎤' },
  { key: 'WORKSHOP',   label: 'Workshops',    emoji: '🛠️' },
  { key: 'MEETUP',     label: 'Meetups',      emoji: '🤝' },
  { key: 'SEMINAR',    label: 'Seminars',     emoji: '📊' },
];

const SORT_OPTIONS = [
  { value: 'date_asc',     label: 'Date (ascending)' },
  { value: 'date_desc',    label: 'Date (descending)' },
  { value: 'popular',      label: 'Popularity' },
  { value: 'availability', label: 'Available spots' },
];

type ViewMode = 'grid' | 'list';
type SortKey  = 'date_asc' | 'date_desc' | 'popular' | 'availability';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters state
  const [search,   setSearch]   = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'ALL');
  const [sort,     setSort]     = useState<SortKey>('date_asc');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

  useEffect(() => {
    eventsService
      .getAll()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];

    // Status
    if (statusFilter !== 'ALL') {
      list = list.filter((e) => e.status === statusFilter);
    }

    // Category
    if (category !== 'ALL') {
      list = list.filter((e) => e.category != null && e.category === (category as EventCategory));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          eventsService.getEventTitle(e).toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case 'date_desc':
        list.sort((a, b) => {
          const da = new Date(eventsService.getEventStartDate(a)).getTime();
          const db = new Date(eventsService.getEventStartDate(b)).getTime();
          return db - da;
        });
        break;
      case 'date_asc':
        list.sort((a, b) => {
          const da = new Date(eventsService.getEventStartDate(a)).getTime();
          const db = new Date(eventsService.getEventStartDate(b)).getTime();
          return da - db;
        });
        break;
      case 'popular':
        list.sort((a, b) => (b.currentParticipants ?? 0) - (a.currentParticipants ?? 0));
        break;
      case 'availability':
        list.sort((a, b) => eventsService.getRemainingSpots(b) - eventsService.getRemainingSpots(a));
        break;
    }

    return list;
  }, [events, search, category, sort, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.trim()) {
      setSearchParams({ q: val, category });
    } else {
      setSearchParams({ category });
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSearchParams(cat !== 'ALL' ? { category: cat } : {});
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('ALL');
    setStatusFilter('ALL');
    setSort('date_asc');
    setSearchParams({});
  };

  const hasFilters = search || category !== 'ALL' || statusFilter !== 'ALL';

  return (
    <main className="events-page">
      {/* Page Header */}
      <section className="events-hero">
        <div className="events-hero__inner">
          <h1 className="events-hero__title">All Events</h1>
          <p className="events-hero__subtitle">
            {loading ? 'Loading…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </section>

      <div className="events-layout">
        {/* ── Sidebar Filters ── */}
        <aside className={`events-sidebar${filterOpen ? ' events-sidebar--open' : ''}`}>
          <div className="sidebar__header">
            <span className="sidebar__title">
              <SlidersHorizontal size={16} /> Filters
            </span>
            {hasFilters && (
              <button className="sidebar__clear-btn" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sidebar__group">
            <h4 className="sidebar__group-title">Status</h4>
            {(['ALL', 'PUBLISHED', 'DRAFT', 'COMPLETED'] as const).map((s) => (
              <label key={s} className="sidebar__radio">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={statusFilter === s}
                  onChange={() => setStatusFilter(s)}
                />
                <span>
                  {s === 'ALL' ? 'All' : s === 'PUBLISHED' ? 'Open' : s === 'DRAFT' ? 'Upcoming' : 'Completed'}
                </span>
              </label>
            ))}
          </div>

          {/* Sort */}
          <div className="sidebar__group">
            <h4 className="sidebar__group-title">Sort by</h4>
            <select
              className="sidebar__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="events-main">
          {/* Toolbar */}
          <div className="events-toolbar">
            {/* Search */}
            <div className="events-search">
              <Search size={16} className="events-search__icon" />
              <input
                type="text"
                placeholder="Search…"
                className="events-search__input"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {search && (
                <button className="events-search__clear" onClick={() => handleSearchChange('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="events-toolbar__right">
              {/* Mobile filter toggle */}
              <button
                className="events-toolbar__filter-btn"
                onClick={() => setFilterOpen((v) => !v)}
              >
                <Filter size={15} />
                Filters
              </button>

              {/* View Mode */}
              <div className="view-toggle">
                <button
                  className={`view-toggle__btn${viewMode === 'grid' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid"
                >
                  <Grid size={15} />
                </button>
                <button
                  className={`view-toggle__btn${viewMode === 'list' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List"
                >
                  <LayoutList size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="category-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`category-chip${category === cat.key ? ' category-chip--active' : ''}`}
                onClick={() => handleCategoryChange(cat.key)}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="active-filters">
              <span className="active-filters__label">Active filters:</span>
              {search && (
                <span className="active-filter-tag">
                  "{search}" <button onClick={() => handleSearchChange('')}><X size={10} /></button>
                </span>
              )}
              {category !== 'ALL' && (
                <span className="active-filter-tag">
                  {CATEGORIES.find((c) => c.key === category)?.label}
                  <button onClick={() => handleCategoryChange('ALL')}><X size={10} /></button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="active-filter-tag">
                  {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')}><X size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="events-loading">
              <LoadingSpinner size="lg" text="Loading events…" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="events-empty">
              <div className="events-empty__icon">🔍</div>
              <h3>No events found</h3>
              <p>Try adjusting your filters or search.</p>
              <button className="events-empty__btn" onClick={clearFilters}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className={`events-results events-results--${viewMode}`}>
              {filtered.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  className={viewMode === 'list' ? 'event-card--list' : ''}
                  // Stagger animation
                  style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
