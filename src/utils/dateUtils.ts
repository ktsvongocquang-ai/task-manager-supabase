import { addDays, isWeekend, startOfDay } from 'date-fns';

/**
 * Adds a specific number of working days to a start date, skipping weekends.
 * @param startDate The date to start counting from
 * @param durationDays The expected number of working days to complete the task
 * @returns The calculated end date (due date)
 */
export const calculateWorkingDays = (startDate: Date | string, durationDays: number): Date => {
    let currentDate = startOfDay(new Date(startDate));
    let daysAdded = 0;

    // Start with the current day, assuming it takes at least 1 day.
    // If the duration is 1 day, the due date is the very next working day.
    while (daysAdded < durationDays) {
        currentDate = addDays(currentDate, 1);
        if (!isWeekend(currentDate)) {
            daysAdded++;
        }
    }

    return currentDate;
};
