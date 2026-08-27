'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import strings from "../locales/en.json";
import { classes, students, avatarColorFor, studentAvatarIndex } from '@/data/academic-data';
import { worksheets } from '@/data/worksheets-data';
import InitialsAvatar from './initials-avatar';

type SearchResult = {
  key: string;
  label: string;
  meta: string;
  group: 'Students' | 'Classes' | 'Worksheets';
  initials?: string;
  avatarBg?: string;
  onSelect: () => void;
};

export default function Topbar() {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const select = (result: SearchResult) => {
    result.onSelect();
    setQuery('');
    setOpen(false);
  };

  const q = query.trim().toLowerCase();
  const results: SearchResult[] = !q
    ? []
    : [
        ...students
          .filter((s) => s.name.toLowerCase().includes(q))
          .slice(0, 4)
          .map((s) => ({
            key: `student-${s.id}`,
            label: s.name,
            meta: classes.find((c) => c.id === s.classId)?.name ?? '',
            group: 'Students' as const,
            initials: s.initials,
            avatarBg: avatarColorFor(studentAvatarIndex(s)),
            onSelect: () => router.push(`/students/${s.id}`),
          })),
        ...classes
          .filter((c) => c.name.toLowerCase().includes(q))
          .slice(0, 4)
          .map((c) => ({
            key: `class-${c.id}`,
            label: c.name,
            meta: `${c.schedule} · ${c.count} students`,
            group: 'Classes' as const,
            onSelect: () => router.push(`/classes/${c.id}`),
          })),
        ...worksheets
          .filter((w) => w.title.toLowerCase().includes(q))
          .slice(0, 4)
          .map((w) => ({
            key: `worksheet-${w.title}`,
            label: w.title,
            meta: `${w.className} · ${w.status}`,
            group: 'Worksheets' as const,
            onSelect: () => router.push(`/worksheets?q=${encodeURIComponent(w.title)}`),
          })),
      ];

  const groupedResults = (['Students', 'Classes', 'Worksheets'] as const)
    .map((group) => ({ group, items: results.filter((r) => r.group === group) }))
    .filter((g) => g.items.length > 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Enter' && results.length > 0) {
      select(results[0]);
    }
  };

  return (
    <Box
      component="header"
      data-testid="topbar"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'rgba(250,247,242,.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #EDE6DB',
        px: { xs: 2, sm: '30px' },
        py: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <ButtonBase onClick={() => router.push('/')} sx={{ flex: '0 0 auto', borderRadius: '6px', px: 0.5 }}>
        <Typography sx={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 500 }}>
          {strings.common.topbarTitle}
        </Typography>
      </ButtonBase>

      <Box ref={containerRef} sx={{ position: 'relative', flex: 1, maxWidth: 380, display: { xs: 'none', sm: 'block' } }}>
        <Stack
          direction="row"
          spacing={1.125}
          sx={{
            alignItems: 'center',
            backgroundColor: '#FFFDFA',
            border: '1px solid #EBE4D9',
            borderRadius: '20px',
            px: 1.75,
            py: 0.875,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A09488" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <InputBase
            placeholder="Search students, classes, worksheets…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query && setOpen(true)}
            onKeyDown={handleKeyDown}
            sx={{ fontSize: 13, flex: 1, minWidth: 0, color: '#2A2622' }}
          />
        </Stack>

        {open && q && (
          <Box
            sx={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#FFFDFA',
              border: '1px solid #EBE4D9',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(42,38,34,.12)',
              overflow: 'hidden',
              zIndex: 40,
              maxHeight: 380,
              overflowY: 'auto',
            }}
          >
            {groupedResults.length === 0 && (
              <Typography sx={{ fontSize: 12.5, color: '#8B837A', px: 2, py: 1.75 }}>
                No matches for &ldquo;{query}&rdquo;
              </Typography>
            )}
            {groupedResults.map(({ group, items }) => (
              <Box key={group}>
                <Typography sx={{ fontSize: 10, letterSpacing: '0.09em', fontWeight: 600, color: '#A09488', px: 2, pt: 1.5, pb: 0.75 }}>
                  {group.toUpperCase()}
                </Typography>
                {items.map((item) => (
                  <ButtonBase
                    key={item.key}
                    onClick={() => select(item)}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 1.375,
                      px: 2,
                      py: 1.125,
                      '&:hover': { backgroundColor: '#FBF7F1' },
                    }}
                  >
                    {item.group === 'Students' && item.initials && item.avatarBg ? (
                      <InitialsAvatar initials={item.initials} bg={item.avatarBg} size={26} fontSize={10} />
                    ) : (
                      <Box sx={{ width: 26, height: 26, borderRadius: item.group === 'Classes' ? '7px' : '5px', backgroundColor: '#F4EFE6', flex: '0 0 auto' }} />
                    )}
                    <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#A09488', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.meta}
                      </Typography>
                    </Box>
                  </ButtonBase>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      <ButtonBase
        onClick={() => router.push('/marking')}
        sx={{
          position: 'relative',
          border: '1px solid #EBE4D9',
          borderRadius: '9px',
          width: 34,
          height: 34,
          display: 'grid',
          placeItems: 'center',
          color: '#6F675E',
          '&:hover': { backgroundColor: '#FFFDFA' },
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
          <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </ButtonBase>

      <ButtonBase
        onClick={() => router.push('/settings')}
        sx={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#D8B384', color: '#4A4038', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}
      >
        SC
      </ButtonBase>
    </Box>
  );
}
