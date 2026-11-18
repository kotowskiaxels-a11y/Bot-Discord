const { handleMemberAdd } = require('../systems/antiraid');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      await handleMemberAdd(member);
    } catch (error) {
      console.error('Error in guildMemberAdd anti-raid handler:', error);
    }
  }
};
