import { Area, RestaurantTable, Reservation } from '@/types/restaurant';

// Fallback local para desarrollo cuando la API responde sin datos.
// Si el backend tiene datos reales, estos no se usan.

export const mockAreas: Area[] = [
	{ id: 'area-terraza', name: 'Terraza', maxTables: 12 },
	{ id: 'area-patio', name: 'Patio', maxTables: 12 },
	{ id: 'area-lobby', name: 'Lobby', maxTables: 10 },
	{ id: 'area-bar', name: 'Bar', maxTables: 10 },
	{ id: 'area-vip', name: 'Salones VIP', maxTables: 8 },
];

export const mockTables: RestaurantTable[] = [
	{ id: 't-terr-1', areaId: 'area-terraza', capacity: 4, type: 'standard', name: 'T1', x: 16, y: 20, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-terr-2', areaId: 'area-terraza', capacity: 4, type: 'standard', name: 'T2', x: 42, y: 28, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-patio-1', areaId: 'area-patio', capacity: 2, type: 'circular', name: 'P1', x: 20, y: 22, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-patio-2', areaId: 'area-patio', capacity: 4, type: 'standard', name: 'P2', x: 52, y: 34, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-lobby-1', areaId: 'area-lobby', capacity: 4, type: 'standard', name: 'L1', x: 25, y: 26, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-lobby-2', areaId: 'area-lobby', capacity: 6, type: 'standard', name: 'L2', x: 58, y: 42, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-bar-1', areaId: 'area-bar', capacity: 2, type: 'circular', name: 'B1', x: 18, y: 24, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-bar-2', areaId: 'area-bar', capacity: 2, type: 'circular', name: 'B2', x: 48, y: 38, isVIP: false, canMerge: false, mergeGroup: null },
	{ id: 't-vip-a', areaId: 'area-vip', capacity: 3, type: 'square', name: 'Cuadrada A', x: 30, y: 30, isVIP: true, canMerge: true, mergeGroup: 'VIP_AB' },
	{ id: 't-vip-b', areaId: 'area-vip', capacity: 3, type: 'square', name: 'Cuadrada B', x: 52, y: 30, isVIP: true, canMerge: true, mergeGroup: 'VIP_AB' },
];
export const mockReservations: Reservation[] = [];