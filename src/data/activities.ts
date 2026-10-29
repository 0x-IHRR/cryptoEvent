import manualData from '../../data/manual-activities.json' with { type: 'json' };
import { Activity } from '../types/activity.js';

export const fallbackManualActivities: Activity[] = manualData as Activity[];
