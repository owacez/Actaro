import { nutritionService } from '@/features/nutrition/nutrition-service';
import { totalNutrition } from '@/features/nutrition/nutrition-model';
import { bodyService } from '@/features/body/body-service';
import { activityService } from '@/features/activity/activity-service';
import { habitService } from '@/features/habits/habit-service';
import {
  habitActive,
  habitToday,
  habitVersion,
  habitValue,
  habitReached,
  isoWeekday,
} from '@/features/habits/habit-model';
import { goalService } from '@/features/goals/goal-service';
import { recoveryService } from '@/features/workouts/recovery-service';
import { recoveryResult } from '@/features/workouts/recovery-model';
import { trainingStatus } from '@/features/workouts/training-overview';
import { workoutService } from '@/features/workouts/workout-service';
import { prestartTotals } from '@/features/workouts/session-model';
import { sessionStore } from '@/features/workouts/session-store';
export const todayService = {
  async load(userId: string) {
    const context = await nutritionService.context(userId),
      today = context.today;
    const [nutrition, body, activity, habits, goals, recovery, session] = await Promise.all([
      nutritionService.diary(userId, today),
      bodyService.history(userId),
      activityService.load(userId, today),
      habitService.all(userId),
      goalService.list(userId),
      recoveryService.load(userId),
      sessionStore.read(userId),
    ]);
    const training = recovery.context,
      splitDay = training.plan?.days[isoWeekday(today) - 1],
      workout =
        splitDay?.workoutId && !splitDay.isRest
          ? await workoutService.load(userId, splitDay.workoutId)
          : null;
    const due = habits.filter((habit) => {
      const date = habitToday(habit),
        version = habitVersion(habit, date);
      return habitActive(habit, date) && version?.weekdays.includes(isoWeekday(date));
    });
    const check = recovery.rows.find((row) => row.local_date === today),
      checkResult = check
        ? recoveryResult(
            {
              energy: check.energy,
              soreness: check.soreness,
              sleep: check.sleep_quality,
              stress: check.stress,
              notes: check.notes ?? '',
            },
            training.overview,
            today,
            splitDay?.isRest ?? false,
          )
        : null;
    return {
      context,
      nutrition,
      total: totalNutrition(nutrition.logs),
      waterMl: nutrition.water.reduce((sum, row) => sum + row.amount_ml, 0),
      body,
      activity,
      habits: due,
      completedHabits: due.filter((habit) => {
        const date = habitToday(habit),
          version = habitVersion(habit, date);
        return version && habitReached(habit, habitValue(habit, date), version.target);
      }).length,
      goals: await goalService.facts(userId, goals.rows),
      training,
      status: trainingStatus(training.overview, today, training.plan),
      recovery: checkResult,
      splitDay,
      workout: workout?.draft ? { draft: workout.draft, ...prestartTotals(workout.draft) } : null,
      session,
    };
  },
};
