<?php

class ServerException extends Exception
{
    public function __construct($what)
    {
        parent::__construct($what);
    }
}

class SearchException extends Exception
{
    public function __construct($what)
    {
        parent::__construct($what);
    }
}

function _error_response(string $msg)
{
    $resp = [
        'success' => false,
        'message' => $msg
    ];
    return json_encode($resp);
}

function _ok_response(array $data)
{
    $resp = [
        'success' => true,
        'payload' => $data
    ];
    return json_encode($resp);
}

function _to_search_request(string $data)
{
    $keys = ['type', 'NtC', 'maxCount', 'redundant', 'large'];
    $decoded = json_decode($data, true);

    if ($decoded === null) {
        throw new SearchException('Bad request');
    }

    foreach ($keys as $key) {
        if (!array_key_exists($key, $decoded)) {
            throw new SearchException('Bad request');
        }
    }

    if ($decoded['type'] !== 'search') {
        throw new SearchException('Bad request');
    }
    if (!is_string($decoded['NtC'])) {
        throw new SearchException('Bad request');
    }
    if (!is_numeric($decoded['maxCount'])) {
        throw new SearchException('Bad request');
    }
    if (!is_bool($decoded['redundant'])) {
        throw new SearchException('Bad request');
    }
    if (!is_bool($decoded['large'])) {
        throw new SearchException('Bad request');
    }

    return $decoded;
}

function _run_db_search(string $NtC, int $maxCount, bool $redundant, bool $large)
{
    $dbh = null;
    if ($redundant === true) {
        $dbh = new SQLite3('search/results.db', SQLITE3_OPEN_READONLY);
    } else {
        $dbh = new SQLite3('search/results_nonredundant.db', SQLITE3_OPEN_READONLY);
    }

    if ($dbh === false) {
        throw new ServerException('Database not available');
    }

    // TODO: Error check!!!
    $ret = $dbh->exec('ATTACH DATABASE "search/resolutions.db" AS resolutions');
    if ($ret === false) {
        throw new ServerException('Database not available');
    }

    $columns = 'step_ID,NtC,nearest_NtC,CANA,confalH,d1,e1,z1,a2,b2,g2,d2,ch1,ch2,resolutions.resolution,resolutions.numsteps,rmsd';

    $query = 'SELECT ' . $columns . ' FROM results INNER JOIN resolutions ON results.pdb_ID = resolutions.pdb_ID WHERE NtC=:ntc';
    if ($large === false) {
        $query .= ' AND resolutions.numsteps < 400';
    }

    $stmt = $dbh->prepare($query);
    $stmt->bindValue(':ntc', $NtC, SQLITE3_TEXT);

    $res = $stmt->execute();

    if ($res === false) {
        return [];
    }

    // This is horrible but we need to know the number of rows in the result beforehand.
    // Therefore, we will run the query twice. Now we just count the number of results.
    $nResults = 0;
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $nResults++;
    }
    $stmt->reset();

    $prob = floor($nResults / $maxCount);

    // Now run the same query again.
    $res = $stmt->execute();
    if ($res === false) {
        throw new ServerException('Internal server error');
    }

    $found = [];
    $remaining = $nResults;
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $r = mt_rand(0, $prob);
        if ($r === 0 || $remaining <= $maxCount - count($found)) {
            $step = [
                'name' => $row['step_ID'],
                'NtC' => $row['NtC'],
                'nearestNtC' => $row['nearest_NtC'],
                'CANA' => $row['CANA'],
                'confal' => $row['confalH'],
                'delta1' => $row['d1'],
                'epsilon1' => $row['e1'],
                'zeta1' => $row['z1'],
                'alpha2' => $row['a2'],
                'beta2' => $row['b2'],
                'gamma2' => $row['g2'],
                'delta2' => $row['d2'],
                'chi1' => $row['ch1'],
                'chi2' => $row['ch2'],
                'resolution' => $row['resolution'],
                'numsteps' => $row['numsteps'],
                'rmsd' => $row['rmsd']
            ];

            $found[] = $step;

            if (count($found) === $maxCount) {
                return $found;
            }
        }

        $remaining--;
    }

    return $found;
}

function _respond($status, $data)
{
    header('Content-Type: application/json');
    http_response_code($status);
    echo $data;
}

$data = file_get_contents('php://input');

try {
    if (!$data) {
        throw new SearchException('Empty request');
    }

    $req = _to_search_request($data);

    $result = _run_db_search($req['NtC'], $req['maxCount'], $req['redundant'], $req['large']);
    _respond(200, _ok_response($result));
} catch (SearchException $ex) {
    _respond(400, _error_response($ex->getMessage()));
} catch (ServerException $ex) {
    _respond(500, _error_response($ex->getMessage()));
}
