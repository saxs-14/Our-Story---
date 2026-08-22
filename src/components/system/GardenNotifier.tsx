import { useEffect } from 'react';
import { useProgressStore, gardenStageFrom } from '@/store/useProgressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { showGardenNotification, requestNotificationPermission } from '@/lib/notify';
import relationship from '@/config/relationship';
import { daysBetween } from '@/lib/time';

export function GardenNotifier() {
  const userId = useAuthStore((s) => s.userId);
  const notificationsOn = useAppStore((s) => s.notificationsOn);
  const waterCount = useProgressStore((s) => s.gardenWaterCount);

  useEffect(() => {
    if (!userId || !notificationsOn) return;

    void requestNotificationPermission();

    const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
    const stage = gardenStageFrom(daysTogether, waterCount);

    // If garden has not been watered recently in this session or stage is blooming
    const stageNames = ['Seed', 'Sprout', 'Growing Bush', 'Flowering Garden', 'Romantic Velvet Garden'];
    const currentName = stageNames[stage] || 'Garden';

    // Schedule a reminder after 4 hours of inactivity
    void showGardenNotification(
      'Our Living Garden 🌱',
      `${relationship.him.nickname} & ${relationship.her.nickname}'s garden is in ${currentName} stage. Tap to give it water ♥`,
      14400,
    );
  }, [userId, notificationsOn, waterCount]);

  return null;
}
