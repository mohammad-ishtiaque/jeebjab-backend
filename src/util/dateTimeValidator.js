import ApiError from "../error/ApiError.js";

/**
 * Validates arrays of dates and times against strict formats.
 * @param {string[]} inputDate - Array of dates in YYYY-MM-DD format
 * @param {string[]} inputTime - Array of times in HH:MM AM/PM format
 */
const dateTimeValidator = (inputDate = [], inputTime = []) => {
  // YYYY-MM-DD format (e.g., 2024-01-15)
  const date_regex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;

  // HH:MM AM/PM format (e.g., 09:30 AM)
  const time_regex = /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/;

  for (const date of inputDate) {
    if (date && !date_regex.test(date)) {
      throw new ApiError(
        400,
        `Invalid date format: "${date}". Expected format: YYYY-MM-DD (e.g., 2024-01-15)`
      );
    }
  }

  for (const time of inputTime) {
    if (time && !time_regex.test(time)) {
      throw new ApiError(
        400,
        `Invalid time format: "${time}". Expected format: HH:MM AM/PM (e.g., 09:30 AM)`
      );
    }
  }

  return true;
};

export default dateTimeValidator;