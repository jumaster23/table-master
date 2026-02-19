import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRestaurantStore, computeTablesWithStatus } from '@/store/restaurant-store';
import { AreaSidebar } from './AreaSidebar';
import { AreaCanvas } from './AreaCanvas';
import { TableActionModal } from './TableActionModal';
import { ReservationModal } from './ReservationModal';
import { ReservationListPanel } from './ReservationListPanel';
import { TableWithStatus } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { RefreshCw, CalendarDays, Unlock } from 'lucide-react';

export function FloorLayout() {
  const loadInitialData = useRestaurantStore((s) => s.loadInitialData);
  const refreshReservations = useRestaurantStore((s) => s.refreshReservations);
  const releaseTable = useRestaurantStore((s) => s.releaseTable);
  const markWalkIn = useRestaurantStore((s) => s.markWalkIn);

  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showReservationList, setShowReservationList] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshReservations, 30000);
    return () => clearInterval(interval);
  }, [refreshReservations]);

  const handleTableClick = useCallback((table: TableWithStatus) => {
    setSelectedTable(table);
    if (table.visualStatus === 'available') {
      setShowActionModal(true);
    }
    // For occupied/reserved tables, clicking them could show release option
  }, []);

  const handleReserve = () => {
    setShowActionModal(false);
    setShowReservationModal(true);
  };

  const handleWalkIn = async () => {
    if (!selectedTable) return;
    await markWalkIn(selectedTable.id);
    setShowActionModal(false);
    setSelectedTable(null);
  };

  const handleRelease = async (tableId: string) => {
    await releaseTable(tableId);
  };

  const dateStr = currentTime.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-foreground tracking-tight">FLOOR MANAGER</h1>
          <div className="h-5 w-px bg-border" />
          <span className="text-xs text-muted-foreground capitalize">{dateStr}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-primary font-bold">{timeStr}</span>
          <div className="h-5 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReservationList(true)}
            className="text-xs text-foreground gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Reservas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshReservations}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <AreaSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AreaCanvas onTableClick={handleTableClick} />
          <OccupiedTableBar onRelease={handleRelease} />
        </div>
      </div>

      {selectedTable && (
        <>
          <TableActionModal
            open={showActionModal}
            onClose={() => { setShowActionModal(false); setSelectedTable(null); }}
            table={selectedTable}
            onReserve={handleReserve}
            onWalkIn={handleWalkIn}
          />
          <ReservationModal
            open={showReservationModal}
            onClose={() => { setShowReservationModal(false); setSelectedTable(null); }}
            table={selectedTable}
          />
        </>
      )}

      <ReservationListPanel
        open={showReservationList}
        onClose={() => setShowReservationList(false)}
      />
    </div>
  );
}

function OccupiedTableBar({ onRelease }: { onRelease: (tableId: string) => void }) {
  const rawTables = useRestaurantStore((s) => s.tables);
  const reservations = useRestaurantStore((s) => s.reservations);

  const releasable = useMemo(() => {
    const all = computeTablesWithStatus(rawTables, reservations, new Date());
    return all.filter((t) =>
      t.visualStatus === 'occupied' ||
      t.visualStatus === 'reserved_active' ||
      t.visualStatus === 'vip_combined'
    );
  }, [rawTables, reservations]);

  if (releasable.length === 0) return null;

  return (
    <div className="border-t border-border bg-card px-4 py-2 shrink-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        Mesas activas — Click para liberar
      </div>
      <div className="flex gap-2 flex-wrap">
        {releasable.map((t) => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => onRelease(t.id)}
            className={cn(
              "h-7 px-2 text-xs gap-1 text-foreground",
              t.visualStatus === 'occupied' ? 'bg-secondary hover:bg-accent' : 'bg-destructive/20 hover:bg-destructive/30'
            )}
          >
            <Unlock className="w-3 h-3" />
            {t.name}
            {t.reservation?.clientName && t.reservation.clientName !== 'Walk-in' && (
              <span className="opacity-60 ml-1">({t.reservation.clientName})</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
