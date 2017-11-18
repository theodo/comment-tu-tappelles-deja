var MAX_NUMBER_OF_CARDS = 20;

function showCard(card) {
  $("#theodoerImg").attr("src", card.imgUrl);
  $("#theodoerNamePlaceholder").show();
  $("#theodoerName").hide();
  $("#theodoerName").text(card.name);
}

function showName() {
  $("#theodoerNamePlaceholder").hide();
  $("#theodoerName").show();
}

function unselectAll() {
  for (q=0; q<=5; q++) {
    $("#q"+q).removeClass("selected");
  }
}

function updateNumberOfCards(n) {
  if(n === -1) {
    $("#nbCards").text($("#nbCards").text()-1);
  } else {
    $("#nbCards").text(n);
  }
}

function updateTotalNumberOfCards(n) {
  if(n === -1) {
    $("#totalNbCards").text($("#totalNbCards").text()-1);
  } else {
    $("#totalNbCards").text(n);
  }
}

function showEndOfGame(nbNamesRemembered, sessionNbCards) {
  var totalNbCards = $("#totalNbCards").text();
  $("#game").html("<p>Good job !</p><p>You got "+nbNamesRemembered+"/"+sessionNbCards+" ("+(nbNamesRemembered/sessionNbCards*100)+"%) of scores &ge; 4 today.</p><p>Come back tomorrow ! You still have " + totalNbCards + " names to learn :)<p>");
}

function waitForAnswer() {
  var wait = $.Deferred();
  $("html").unbind("keydown");
  $("html").keydown(function(e) {
    if(e.which === 13 || e.which === 32) {
      wait.resolve();
    }
  });
  return wait;
}

function waitForQuality() {
  var wait = $.Deferred();
  var q = 3;
  $("#q"+q).addClass("selected");
  $("html").unbind("keydown");
  $("html").keydown(function(e) {
    unselectAll();
    var resolve = false;
    switch(e.which) {
      case 13:
      case 32:
        resolve = true;
        break;
      case 38:
        q = q === 5 ? 5 : q+1;
        break;
      case 40:
        q = q === 0 ? 0 : q-1;
        break;
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
        q = e.which - 48;
        resolve = true;
        break;
      case 96:
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
        q = e.which - 96;
        resolve = true;
        break;
    }
    $("#q"+q).addClass("selected");
    if(resolve)
      wait.resolve(q);
  });
  $("#doNotShow")
  .prop('disabled', false)
  .click(function() {
    wait.resolve('doNotShow');
  });
  return wait;
}

function getInterval(n, EF) {
  return n === 1 ? 1 : n === 2 ? 6 : Math.round(getInterval(n-1, EF)*EF);
}

function getNewEF(EF, q) {
  var EF_ = EF+(0.1-(5-q)*(0.08+(5-q)*0.02));
  return EF_ < 1.3 ? 1.3 : EF_;
}

/* Fisher-Yates shuffle */
function shuffle (array) {
  var i = 0, j = 0, temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function shuffleCards(cardIds) {
  var shuffledCardIds = Array.from(cardIds);
  shuffle(shuffledCardIds);
  return shuffledCardIds;
}

function getCard(cardId) {
  var card = JSON.parse(localStorage.getItem(cardId));
  if(typeof card.dueDate !== 'undefined') {
    card.dueDate = moment(card.dueDate);
  }
  return card;
}

function saveCard(cardId, card) {
  localStorage.setItem(cardId, JSON.stringify(card));
}

function deleteCard(cardId) {
  localStorage.removeItem(cardId);
}

function getPreviousCardsList() {
  var cardsList = localStorage.getItem("previousCardsList");
  return cardsList === null ? [] : JSON.parse(cardsList);
}

function saveCardsList(cardsList) {
  localStorage.setItem("previousCardsList", JSON.stringify(cardsList));
}

function isDue(card) {
  if(typeof card.dueDate === 'undefined') {
    return false;
  }
  return moment().startOf("day") >= card.dueDate;
}

function getTodaysCardsList(currentTeam) {
  var previousIds = getPreviousCardsList();
  var newIds = [];

  // Remove obsolete cards
  var currentTeamIds = currentTeam.map(function(theodoer) {
    return theodoer.id;
  });
  for(var oldTheodoerId of previousIds) {
    if(currentTeamIds.indexOf(oldTheodoerId) === -1) {
      deleteCard(oldTheodoerId);
    } else {
      newIds.push(oldTheodoerId);
    }
  }

  for(var theodoer of currentTeam) {
    // Create cards for new theodoers
    if(newIds.indexOf(theodoer.id) === -1) {
      saveCard(theodoer.id, {
        imgUrl: theodoer.imgUrl,
        name: theodoer.name,
        EF: 2.5,
        n: 1
      });
      newIds.push(theodoer.id);
    }

    // Update imgUrl if needed
    var card = getCard(theodoer.id);
    card.imgUrl = theodoer.imgUrl
    saveCard(theodoer.id, card);
  }

  // Save new list for future reference
  saveCardsList(newIds);

  newIds = shuffleCards(newIds);
  totalNbCardsRemaining = 0;
  // Then, get cards due today
  var sessionCardIds = [];
  for(var i=1; i<newIds.length; i++) {
    var theodoerId = newIds[i];
    var theodoerCard = getCard(theodoerId);
    if(isDue(theodoerCard) && !theodoerCard.doNotShow) {
      sessionCardIds.push(theodoerId);
    }

    if(!theodoerCard.doNotShow) {
      totalNbCardsRemaining ++;
    }
  }
  updateTotalNumberOfCards(totalNbCardsRemaining);

  // Add new cards if not enough
  for(var i=1; i<newIds.length; i++) {
    var theodoerId = newIds[i];
    if(sessionCardIds.indexOf(theodoerId) === -1
    && sessionCardIds.length < MAX_NUMBER_OF_CARDS
    && typeof getCard(theodoerId).dueDate === 'undefined') {
      var card = getCard(theodoerId);
      card.dueDate = moment().startOf("day");
      saveCard(theodoerId, card);
      sessionCardIds.push(theodoerId);
    }
  }

  // Return today's cards
  return sessionCardIds;
}

/********************************************************/
/* https://www.supermemo.com/english/ol/sm2.htm */

/*
STEP 1
  With all items associate an E-Factor equal to 2.5.
STEP 2
  Repeat items using the following intervals:
  I(1):=1
  I(2):=6
  for n>2: I(n):=I(n-1)*EF
  where:
  I(n) - inter-repetition interval after the n-th repetition (in days),
  EF - E-Factor of a given item
  If interval is a fraction, round it up to the nearest integer.
STEP 3
  After each repetition assess the quality of repetition response in 0-5 grade scale:
  5 - perfect response
  4 - correct response after a hesitation
  3 - correct response recalled with serious difficulty
  2 - incorrect response; where the correct one seemed easy to recall
  1 - incorrect response; the correct one remembered
  0 - complete blackout.
STEP 4
  After each repetition modify the E-Factor of the recently repeated item according to the formula:
  EF':=EF+(0.1-(5-q)*(0.08+(5-q)*0.02))
  where:
  EF' - new value of the E-Factor,
  EF - old value of the E-Factor,
  q - quality of the response in the 0-5 grade scale.
  If EF is less than 1.3 then let EF be 1.3.
STEP 5
  If the quality response was lower than 3 then start repetitions for the item from the beginning
  without changing the E-Factor (i.e. use intervals I(1), I(2) etc. as if the item was memorized anew).
STEP 6
  After each repetition session of a given day repeat again all items that scored below four
  in the quality assessment.
  Continue the repetitions until all of these items score at least four.
*/
function play(currentTeam) {
  var todaysCardsList = getTodaysCardsList(currentTeam);
  var sessionNbCards = todaysCardsList.length;
  var nbNamesRemembered = 0;
  var endOfFirstTry = false;
  updateNumberOfCards(sessionNbCards);
  var synchroniser = $.Deferred();
  synchroniser.progress(function(i, todaysCardsList) {
    if(i === todaysCardsList.length) {
      endOfFirstTry = true;
      var newCardsList = [];
      for(var j = 0; j < todaysCardsList.length; j++) {
        var cardId = todaysCardsList[j];
        var card = getCard(cardId);
        if(isDue(card) && !card.doNotShow) {
          newCardsList.push(cardId);
        }
      }
      todaysCardsList = shuffleCards(newCardsList);
      i = 0;
    }

    if(todaysCardsList.length === 0) {
      showEndOfGame(nbNamesRemembered, sessionNbCards);
      return;
    }

    var cardId = todaysCardsList[i];
    var card = getCard(cardId);
    showCard(card);
    waitForAnswer().then(function() {
      showName();

      waitForQuality().then(function(quality) {
        unselectAll();
        $("#doNotShow").unbind().prop('disabled', true);
        if(quality === 'doNotShow') {
          card.doNotShow = true;
          updateNumberOfCards(-1);
          updateTotalNumberOfCards(-1);
          if(!endOfFirstTry) {
            nbNamesRemembered++;
          }
        } else {
          // STEP 4
          card.EF = getNewEF(card.EF, quality);

          // STEP 5
          if(quality < 3) {
            card.n = 1;
          }

          // STEP 6
          if(quality >= 4) {
            var interval = getInterval(card.n, card.EF);
            card.dueDate = moment().startOf("day").add(interval, "days");
            card.n++;
            updateNumberOfCards(-1);
            if(!endOfFirstTry) {
              nbNamesRemembered++;
            }
          } else {
            iterate = true;
          }
        }

        saveCard(cardId, card);
        synchroniser.notify(i+1, todaysCardsList);
      });
    });
  });
  synchroniser.notify(0, todaysCardsList);
}
