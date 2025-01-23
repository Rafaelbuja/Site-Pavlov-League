<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pavlov League</title>
    <style>
        /* Estilos gerais */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-image: url('pavlov league wall.jpg');
            background-size: cover;
            background-position: center;
            color: white;
        }

        #table-container {
            width: 90%;
            max-width: 1200px;
            margin: 20px auto;
        }

        /* Estilos da tabela */
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: rgba(0, 0, 0, 0.8);
            color: yellow;
            text-align: center;
        }

        th, td {
            padding: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        th {
            background-color: rgba(255, 255, 255, 0.1);
            text-transform: uppercase;
        }

        tr:nth-child(even) {
            background-color: rgba(255, 255, 255, 0.1);
        }

        tr:hover {
            background-color: rgba(255, 255, 0, 0.2);
            cursor: pointer;
        }

        @media (max-width: 600px) {
            table {
                font-size: 12px;
            }
            th, td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <h1>Pavlov League - Classificação</h1>
    <div id="table-container"></div>

    <script src="../dados_raw.js"></script> <!-- Certifique-se de que este arquivo contém o array all_matches -->
    <script>
        function processMatchData(all_matches) {
            const container = document.getElementById("table-container");

            // Objeto para armazenar dados agregados de cada time
            const teams = {};
            const matchesById = {};

            // Agrupa os dados por MatchId
            all_matches.forEach((match) => {
                if (!matchesById[match.MatchId]) {
                    matchesById[match.MatchId] = [];
                }
                matchesById[match.MatchId].push(match);
            });

            // Processa cada embate (MatchId)
            Object.entries(matchesById).forEach(([matchId, maps]) => {
                const teamScores = {};
                const roundsPro = {};
                const roundsAgainst = {};

                // Processa os mapas do embate
                maps.forEach((map) => {
                    Object.entries(map).forEach(([key, value]) => {
                        if (key.endsWith("Score")) {
                            const teamName = key.replace("Score", "");
                            if (!teamScores[teamName]) {
                                teamScores[teamName] = 0;
                                roundsPro[teamName] = 0;
                                roundsAgainst[teamName] = 0;
                            }

                            // Soma os placares do mapa
                            teamScores[teamName] += value;
                            roundsPro[teamName] += value;
                        }
                    });

                    // Calcula rounds contra de cada time
                    const mapScores = Object.entries(map).filter(([key]) => key.endsWith("Score"));
                    mapScores.forEach(([teamKey, teamScore]) => {
                        const teamName = teamKey.replace("Score", "");
                        mapScores.forEach(([opponentKey, opponentScore]) => {
                            // A soma de rounds contra deve ser feita somente entre os times diferentes
                            if (teamKey !== opponentKey) {
                                roundsAgainst[teamName] += opponentScore;
                            }
                        });
                    });
                });

                // Identifica os times do embate
                const teamsInMatch = Object.keys(teamScores);
                if (teamsInMatch.length !== 2) {
                    console.error(`Embate inválido em MatchId ${matchId}:`, teamsInMatch);
                    return;
                }

                const [teamA, teamB] = teamsInMatch;
                const scoreA = teamScores[teamA];
                const scoreB = teamScores[teamB];

                // Inicializa os times no objeto principal, se necessário
                [teamA, teamB].forEach((team) => {
                    if (!teams[team]) {
                        teams[team] = {
                            name: team,
                            points: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            roundsPro: 0,
                            roundsAgainst: 0,
                            des: 0,
                        };
                    }
                });

                // Atualiza os rounds pró e contra
                teams[teamA].roundsPro += roundsPro[teamA];
                teams[teamA].roundsAgainst += roundsAgainst[teamA];
                teams[teamB].roundsPro += roundsPro[teamB];
                teams[teamB].roundsAgainst += roundsAgainst[teamB];

                // Determina o resultado do embate com base nos mapas individuais
                const teamAWins = maps.filter((map) => map[`${teamA}Score`] > map[`${teamB}Score`]).length;
                const teamBWins = maps.filter((map) => map[`${teamB}Score`] > map[`${teamA}Score`]).length;

                // Se um time vencer ambos os mapas, ele ganha 3 pontos
                if (teamAWins === 2) {
                    teams[teamA].wins++;
                    teams[teamA].points += 3;
                    teams[teamB].losses++;
                } else if (teamBWins === 2) {
                    teams[teamB].wins++;
                    teams[teamB].points += 3;
                    teams[teamA].losses++;
                }
                // Se houver empate no placar agregado (um mapa para cada), ambos os times recebem 1 ponto
                else if (teamAWins === 1 && teamBWins === 1) {
                    teams[teamA].draws++;
                    teams[teamB].draws++;
                    teams[teamA].points++;
                    teams[teamB].points++;
                }
            });

            // Calcula o critério de desempate (DES)
            Object.values(teams).forEach((team) => {
                team.des =
                    team.points * 10000 +
                    team.wins * 100 +
                    team.roundsPro * 10 -
                    team.roundsAgainst;
            });

            // Ordena os times pelo critério de desempate (DESC)
            const sortedTeams = Object.values(teams).sort((a, b) => b.des - a.des);

            // Criação da tabela
            const table = document.createElement("table");

            // Cabeçalho da tabela
            const headerRow = table.insertRow();
            ["Pos", "Time", "Pts", "Vit", "Emp", "Der", "RP", "RC"].forEach((header) => {
                const cell = document.createElement("th");
                cell.textContent = header;
                headerRow.appendChild(cell);
            });

            // Adiciona linhas para cada time
            sortedTeams.forEach((team, index) => {
                const row = table.insertRow();
                row.insertCell().textContent = index + 1; // Classificação
                row.insertCell().textContent = team.name; // Nome do time
                row.insertCell().textContent = team.points; // Pontos
                row.insertCell().textContent = team.wins; // Vitórias
                row.insertCell().textContent = team.draws; // Empates
                row.insertCell().textContent = team.losses; // Derrotas
                row.insertCell().textContent = team.roundsPro; // Rounds Pro
                row.insertCell().textContent = team.roundsAgainst; // Rounds Contra
            });

            // Adiciona a tabela ao container
            container.appendChild(table);
        }

        // Processar dados brutos
        processMatchData(window.all_matches);
    </script>
</body>
</html>
