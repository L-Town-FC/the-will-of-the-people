function createMessage() {
  function sendMock(...args) {
    sendMock.calls.push(args);
  }

  sendMock.calls = [];

  return {
    channel: {
      send: sendMock,
    },
  };
}

module.exports = {
  createMessage,
};
