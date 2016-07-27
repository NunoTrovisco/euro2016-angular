// app.js

// create the module and name it euroApp
var euroApp = angular.module('euroApp', []);
var NUM_GROUP_STAGE_GAMES = 3;
var ROUND_OF_16 = 4,
    QUARTER_FINALS = 5,
    SEMI_FINALS = 6,
    FINAL = 7;
var TEAMS_GROUP = {};


var resultETorPK = function(result) {
    return result.penaltyShootout || result.extraTime || result;
};

var getWinningTime = function(result) {
    var time;

    if (result.penaltyShootout) {
        time = "P.K";
    } else if (result.extraTime) {
        time = "E.T";
    } else {
        time = "";
    }
    return time;
};

var fixturesRequest = function($http, $scope) {
    $http({
        method: "GET",
        url: "http://api.football-data.org/v1/soccerseasons/424/fixtures",
        headers: {
            'X-AUTH-TOKEN': '53e6bee2dade46858d67b06f85972363'
        }
    }).then(function mySucces(response) {
        //matchday: 3
        var i = 0;
        var groupStageEnded = false;

        while (!groupStageEnded) {
            var match = response.data.fixtures[i];

            if (match.matchday <= NUM_GROUP_STAGE_GAMES) {
                var group = $scope.leagueTable.find(function(elem) {
                    return elem.group === TEAMS_GROUP[match.homeTeamName]
                });

                group.groupMatches.push({
                    homeTeamName: match.homeTeamName,
                    awayTeamName: match.awayTeamName,
                    goalsHomeTeam: match.result.goalsHomeTeam,
                    goalsAwayTeam: match.result.goalsAwayTeam
                });
            } else {
                groupStageEnded = true;
            }
            i++;
        }

        for (; i < response.data.fixtures.length; i++) {
            var value = response.data.fixtures[i];
            var idx = -1;

            switch (value.matchday) {
                case ROUND_OF_16:
                    idx = 0;
                    break;
                case QUARTER_FINALS:
                    idx = 1;
                    break;
                case SEMI_FINALS:
                    idx = 2;
                    break;
                case FINAL:
                    idx = 3;
                    break;
                default:
                    idx = -1;
            }

            $scope.gameResults[idx].matches.push({
                homeTeamName: value.homeTeamName,
                awayTeamName: value.awayTeamName,
                goalsHomeTeam: resultETorPK(value.result).goalsHomeTeam,
                goalsAwayTeam: resultETorPK(value.result).goalsAwayTeam,
                matchEnd: getWinningTime(value.result)
            });
            // results.extraTime, results.penaltyShootout
        }

    }, function myError(response) {
        $scope.hasError = true;
        $scope.errorMessage = response.statusText || "Error loading data";
    });
}

var leagueTablesRequest = function($http, $scope){
    $http({
            method: "GET",
            url: "http://api.football-data.org/v1/soccerseasons/424/leagueTable",
            headers: {
                'X-AUTH-TOKEN': '53e6bee2dade46858d67b06f85972363'
            }
        }).then(function mySucces(response) {
            angular.forEach(response.data.standings, function(value, key) {
                var ranks = [];

                for (var i = 0; i < value.length; i++) {
                    ranks.push({
                        flag: value[i].crestURI,
                        team: value[i].team,
                        points: value[i].points,
                        goals: value[i].goals,
                        goalsAgainst: value[i].goalsAgainst,
                        goalDifference: value[i].goalDifference
                    });
                    TEAMS_GROUP[value[i].team] = key;
                }
                $scope.leagueTable.push({
                    group: key,
                    ranks: ranks,
                    groupMatches: []
                });
            });

            fixturesRequest($http, $scope);
        }, function myError(response) {
            $scope.hasError = true;
            $scope.errorMessage = response.statusText || "Error loading data";
        });
} 

// create the controller and inject Angular's $scope
euroApp.controller('mainController', ["$scope", "$http",
    function($scope, $http) {
        $scope.gameResults = [{
            round: 'Round of 16',
            matches: []
        }, {
            round: 'Quarter Finals',
            matches: []
        }, {
            round: 'Semi Finals',
            matches: []
        }, {
            round: 'Final',
            matches: []
        }];
        $scope.leagueTable = [];
        $scope.groupStage = [];

        leagueTablesRequest($http, $scope);
    }
]);