// Minimal avatar service stub for AnimatedAvatar compatibility

export const avatarService = {
  getUserAvatar(userId: number) {
    // TODO: Replace with real data fetching logic (API call, etc.)
    // This is a stub to allow the build to pass
    return {
      url: `/avatars/${userId}.png`,
      animations: [
        {
          name: 'idle',
          duration: 2000,
          frameRate: 30,
          loop: true,
          trigger: 'auto',
        },
        {
          name: 'wave',
          duration: 1000,
          frameRate: 30,
          loop: false,
          trigger: 'click',
        },
      ],
    };
  },
  // Add more methods as needed for your app
};
