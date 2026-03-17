export default [
  {
    method: 'POST',
    path: '/generate',
    handler: 'audioController.generate',
    config: {
      policies: [],
    },
  },
];
