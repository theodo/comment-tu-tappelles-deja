var MAX_NUMBER_OF_CARDS = 20;

function getCurrentTeam() {
  var currentTeam = [];
  $("#team-people .img-square-list .isotope-item").each(function() {
    var imgUrl = $(".img-square img", this).attr("src");
    // this splits the url around '/', retrieves name.png, splits around '.', retrieves name
    var id = imgUrl.split("/").pop().split(".")[0];
    var name = $("p", this).text();
    currentTeam.push({imgUrl: imgUrl, id: id, name: name});
  });
  return currentTeam;
}

function displayGame() {
  $("body").hide();
  $("body").after("\
    <div id='game'>\
      <p>This game uses a scientific learning algorithm that you can find <a href='https://www.supermemo.com/english/ol/sm2.htm'>here</a>.</p>\
      <h3>How to play:</h3>\
        <ul>\
          <li>Think about the name of the theodoer you see.</li>\
          <li>Press <strong>enter</strong> to reveal his/her real name.</li>\
          <li>Using the arrow <strong>up</strong> and <strong>down</strong> keys, select how well you remembered his/her name <em>this time</em>\
          i.e. do not select the quality of your long-term memory but the quality of your short term one.\
          The algorithm is designed to take these effects into account.</li>\
          <li>Press <strong>enter</strong> to validate your choice and go to the next theodoer.</li>\
          <li>Each day, a new set of theodoer is presented to you based on your last session.</li>\
          <li>The game ends when you have answered at least 4 for each theodoer that is presented to you.</li>\
        </ul>\
      <p><span id='nbCards'></span> cards remaining for today. <span id='totalNbCards'></span> remaining on the whole.</p>\
      <br/><br/>\
      <span id='card'>\
        <div class='img-square'>\
          <img id='theodoerImg'/>\
        </div>\
        <p id='theodoerName'></p>\
      </span>\
      <span id='quality'>\
        <h4>How well did you remember that name ?</h4>\
        <button id='doNotShow' disabled='disabled'>No need to ever show this person again</button>\
        <div id='q5'>5 - Perfect Response</div>\
        <div id='q4'>4 - Correct response after a hesitation</div>\
        <div id='q3'>3 - Correct response recalled with serious difficulty</div>\
        <div id='q2'>2 - Incorrect response; where the correct one seemed easy to recall</div>\
        <div id='q1'>1 - Incorrect response; the correct one remembered</div>\
        <div id='q0'>0 - Complete blackout</div>\
      </span>\
    </div>\
  ");
}

function showCard(card) {
  $("#theodoerImg").attr("src", card.imgUrl);
  $("#theodoerName").hide();
  $("#theodoerName").text(card.name);
}

function showName() {
  $("#theodoerName").show();
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

function showEndOfGame() {
  var totalNbCards = $("#totalNbCards").text();
  $("#game").html("<p>Good job ! Come back tomorrow ! You still have " + totalNbCards + " names to learn :)<p>");
}

function waitForAnswer() {
  var wait = $.Deferred();
  $("html").unbind("keydown");
  $("html").keydown(function(e) {
    if(e.which === 13) {
      wait.resolve();
    }
  });
  return wait;
}

function waitForQuality() {
  var wait = $.Deferred();
  var q = 3;
  $("#q"+q).toggleClass("selected");
  $("html").unbind("keydown");
  $("html").keydown(function(e) {
    $("#q"+q).toggleClass("selected");
    switch(e.which) {
      case 13:
        wait.resolve(q);
        return;
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
        wait.resolve(e.which-48);
        return;
    }
    $("#q"+q).toggleClass("selected");
  });
  $("#doNotShow")
  .prop('disabled', false)
  .click(function() {
    wait.resolve('doNotShow');
    $("#q"+q).toggleClass("selected");
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

function getTodaysCardsList() {
  var currentTeam = getCurrentTeam();
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

  // Create cards for new theodoers
  for(var theodoer of currentTeam) {
    if(newIds.indexOf(theodoer.id) === -1) {
      saveCard(theodoer.id, {
        imgUrl: theodoer.imgUrl,
        name: theodoer.name,
        EF: 2.5,
        n: 1
      });
      newIds.push(theodoer.id);
    }
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
function play() {
  displayGame();
  var todaysCardsList = getTodaysCardsList();
  updateNumberOfCards(todaysCardsList.length);
  var synchroniser = $.Deferred();
  synchroniser.notify(0, todaysCardsList);
  synchroniser.progress(function(i, todaysCardsList) {
    if(i === todaysCardsList.length) {
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
      showEndOfGame();
      return;
    }

    var cardId = todaysCardsList[i];
    var card = getCard(cardId);
    showCard(card);
    waitForAnswer().then(function() {
      showName();

      waitForQuality().then(function(quality) {
        $("#doNotShow").unbind().prop('disabled', true);
        if(quality === 'doNotShow') {
          card.doNotShow = true;
          updateNumberOfCards(-1);
          updateTotalNumberOfCards(-1);
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
          } else {
            iterate = true;
          }
        }

        saveCard(cardId, card);
        synchroniser.notify(i+1, todaysCardsList);
      });
    });
  });
}

////////////////////////////////////////////
play();
////////////////////////////////////////////
