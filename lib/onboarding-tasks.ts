/**
 * Onboarding Tasks - Predefined tasks to guide prospects through key Mews features
 *
 * These 8 tasks are automatically created in each new trial sandbox to help
 * prospects learn the core Mews workflows (reservations, check-in/out, billing, etc.).
 */

export interface OnboardingTask {
  Name: string;
  Description: string;
}

/**
 * Returns the list of 8 onboarding tasks with markdown descriptions and help article links.
 */
export function getOnboardingTasks(): OnboardingTask[] {
  return [
    {
      Name: 'Task 1: Create a New Reservation',
      Description:
        '### What to do\nCreate a reservation for a guest arriving next week for a **3-night stay**. Choose a space type, select a rate, and complete the booking.\n\n### How to do it\n1. Go to the **Timeline** and click on an available space\n2. Fill in the guest details, dates, and rate\n3. Confirm the reservation\n\n\ud83d\udcd6 [Help article: Create a reservation](https://help.mews.com/s/article/create-a-reservation)',
    },
    {
      Name: 'Task 2: Check In a Reservation',
      Description:
        '### What to do\nFind the reservation you created in Task 1 and **check the guest in**. Assign a room and confirm the check-in is complete.\n\n### How to do it\n1. Open the reservation from the **Timeline** or **Reservation Overview**\n2. Click **Check in**\n3. Verify the room assignment and confirm\n\n\ud83d\udcd6 [Help article: Check in a reservation](https://help.mews.com/s/article/check-in-a-reservation)',
    },
    {
      Name: 'Task 3: Check Out a Reservation',
      Description:
        '### What to do\nLocate a checked-in reservation, review the guest\'s bill, and **complete the check-out** process.\n\n### How to do it\n1. Open the checked-in reservation\n2. Navigate to the **Billing** tab and review all charges\n3. Close the bill and click **Check out**\n\n\ud83d\udcd6 [Help article: Check out a reservation](https://help.mews.com/s/article/how-to-check-out-a-reservation)',
    },
    {
      Name: 'Task 4: Cancel a Reservation',
      Description:
        '### What to do\nOpen a future reservation and **cancel it**. Select a cancellation reason and review the cancellation fee applied.\n\n### How to do it\n1. Open a confirmed reservation\n2. Click the **more actions** menu and select **Cancel**\n3. Choose a cancellation reason and confirm\n\n\ud83d\udcd6 [Help article: Cancel a reservation](https://help.mews.com/s/article/cancel-a-reservation)',
    },
    {
      Name: 'Task 5: Add a Product to a Reservation',
      Description:
        '### What to do\nOpen an existing reservation and **add a product** (e.g. breakfast, parking, or minibar) to the booking.\n\n### How to do it\n1. Open a reservation and go to the **Products** tab\n2. Select a product to add\n3. Verify it appears on the **Billing** tab\n\n\ud83d\udcd6 [Help article: Add products to a reservation](https://help.mews.com/s/article/How-to-link-additional-products-to-a-reservation-in-Mews-Operations)',
    },
    {
      Name: 'Task 6: Correct a Closed Bill',
      Description:
        '### What to do\nFind a closed bill and use the **rebate process** to correct it. This simulates a common post-checkout billing fix.\n\n### How to do it\n1. Go to the guest\'s profile or reservation\n2. Locate the **closed bill**\n3. Follow the rebate workflow to issue a correction\n\n\ud83d\udcd6 [Help article: Correct a closed bill](https://help.mews.com/s/article/new-billing-procedure-correct-a-closed-bill)',
    },
    {
      Name: 'Task 7: Change the Reservation Owner',
      Description:
        '### What to do\nOpen a reservation and **reassign the owner** to a different guest profile.\n\n### How to do it\n1. Open a reservation with a companion or create one\n2. Click the **owner name** to edit it\n3. Search for and select a different guest as the new owner\n\n\ud83d\udcd6 [Help article: Change the reservation owner](https://help.mews.com/s/article/How-to-change-the-guest-on-a-reservation)',
    },
    {
      Name: 'Task 8: Look Up a Guest Profile',
      Description:
        '### What to do\nSearch for a guest by name and **review their customer profile**, including past reservations and guest insights.\n\n### How to do it\n1. Use the **search bar** to find a guest by name or email\n2. Open their **customer profile**\n3. Explore the tabs: reservations, billing history, and guest insights\n\n\ud83d\udcd6 [Help article: Guest insights](https://help.mews.com/s/article/How-to-identify-returning-guests-using-guest-insights-in-Mews-Operations)',
    },
  ];
}
