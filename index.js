TRELLO_KEY = '1ea14042288078831c6f097dff6d2e05';
M33_PEOPLE_BOARD_ID = 'JLBMh7wp';

Trello.setKey(TRELLO_KEY);

function getAllM33People() {
  return new Promise(function(resolve, reject){
    Trello.get(
      '/boards/' + M33_PEOPLE_BOARD_ID + '/cards',
      {
        fields: ['id', 'name', 'idList'],
        attachments: 'cover',
        attachment_fields: 'url'
      },
      resolve,
      reject
    );
  });
}

function getM33Enterprises() {
  return new Promise(function(resolve, reject) {
    Trello.get(
      '/boards/' + M33_PEOPLE_BOARD_ID + '/lists',
      {
        fields: ['id', 'name']
      },
      function(lists) {
        var enterprisesNames = {};
        for(var i = 0; i<lists.length; i++) {
          var list = lists[i];
          enterprisesNames[list.id] = list.name.split('|')[0];
        }
        resolve(enterprisesNames);
      },
      reject
    );
  });
}

var authenticationSuccess = function() {
  //get all m33 people in the board
  getAllM33People()
  .then(function(cards) {
    getM33Enterprises()
    .then(function(enterprisesNames) {
      //reduce each card and remove those without photo
      currentTeam = [];
      for(var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.attachments.length > 0) {
          currentTeam.push({
            imgUrl: card.attachments[0].url,
            id: card.id,
            name: card.name + ' (' + enterprisesNames[card.idList] + ')'
          });
        }
      }
      //launch the game
      play(currentTeam);
    });
  });
};

var authenticationFailure = function() {
  console.log('Failed authentication');
};

window.Trello.authorize({
  type: 'redirect',
  name: 'Comment tu t\'appelles déjà ?',
  expiration: 'never',
  success: authenticationSuccess,
  error: authenticationFailure
});
