var TravelType = {
  arrival: 'Arrival',
  departure: 'Departure',
};

function readAndFormatTravelHistoryTable () {
  const travelHistories = $('.history-results tbody').children().map(
    function () {
      return Object.assign({}, ...$(this).children('td').map(function () {
        return { [this.className]: $(this).text() };
      }).get());
    }
  ).get();
  return travelHistories;
}

function parseTravelHistory (travelHistory) {
  const parsers = {
    travelDate: t =>
      luxon.DateTime.fromFormat(t, 'yyyy-MM-dd', {
        zone: 'America/Los_Angeles'
      }),
  };
  for (const key in travelHistory) {
    if (parsers.hasOwnProperty(key)) {
      travelHistory[key] = parsers[key](travelHistory[key]);
    }
  }
  return travelHistory;
}

function generateTravelPairsFromTravelHistories (travelHistories) {
  const now = luxon.DateTime.local();

  travelHistories.sort(function (a, b) {
    return a.travelDate - b.travelDate;
  });

  const residencyInfo = travelHistories.reduce(({
    currentTravelPair,
    isInUs,
    travelPairs,
  }, travelHistory) => {
    if (isInUs && travelHistory.travelType === TravelType.departure) {
      currentTravelPair.end = travelHistory.travelDate;
      return {
        currentTravelPair: null,
        isInUs: false,
        travelPairs: [ ...travelPairs, currentTravelPair ],
      };
    } else if (!isInUs && travelHistory.travelType === TravelType.arrival) {
      return {
        currentTravelPair: { start: travelHistory.travelDate },
        isInUs: true,
        travelPairs,
      };
    } else {
      throw new Error('Invalid travel history');
    }
  }, {
    currentTravelPair: null,
    isInUs: false,
    travelPairs: [],
  });

  if (residencyInfo.isInUs) {
    residencyInfo.currentTravelPair.end = now;
    residencyInfo.travelPairs = [
      ...residencyInfo.travelPairs,
      residencyInfo.currentTravelPair
    ];
    residencyInfo.currentTravelPair = null;
    residencyInfo.isInUs = false;
  }

  return residencyInfo.travelPairs;
}

function separateTravelPairs (travelPairs) {
  const separatedTravelPairs = travelPairs.reduce(
    (separatedTravelPairs, residencyPair) => {
      while (residencyPair.start.year < residencyPair.end.year) {
        newStart = luxon.DateTime.fromObject({
          year: residencyPair.start.year + 1,
          month: 1,
          day: 1,
          zone: 'America/Los_Angeles'
        });
        newEnd = newStart.minus(1);
        separatedTravelPairs.push({
          start: residencyPair.start,
          end: newEnd,
        });
        residencyPair.start = newStart;
      }
      separatedTravelPairs.push(residencyPair);
      return separatedTravelPairs;
    },
    []
  );

  return separatedTravelPairs;
}

function aggregateTravelPairsByYear (travelPairs) {
  travelPairs.map(travelPair => {
    travelPair.year = travelPair.start.year;
    travelPair.interval = Math.round(luxon.Interval.fromDateTimes(
      travelPair.start,
      travelPair.end,
    ).toDuration('days').toObject().days);
    return travelPair;
  });
  const sum = travelPairs.reduce((sum, travelPair) => {
    const year = travelPair.year;
    sum[year] = sum[year] || 0;
    sum[year] += travelPair.interval;
    return sum;
  }, {});
  console.log(sum);
}

function readTravelHistoryTableAndCalculateResidencyInterval () {
  let travelHistories = readAndFormatTravelHistoryTable();
  if (!travelHistories.length) return;

  travelHistories = travelHistories.map(parseTravelHistory);

  const travelPairs = generateTravelPairsFromTravelHistories(travelHistories);
  const separatedTravelPairs = separateTravelPairs(travelPairs);
  const intervalByYear = aggregateTravelPairsByYear(separatedTravelPairs);
}

window.addEventListener('hashchange', function (e) {
  readTravelHistoryTableAndCalculateResidencyInterval();
});

readTravelHistoryTableAndCalculateResidencyInterval();
