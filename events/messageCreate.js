const { handleMessage } = require('../systems/antiraid');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      await handleMessage(message);
    } catch (error) {
      console.error('Error in messageCreate anti-raid handler:', error);
    }
  }
};
