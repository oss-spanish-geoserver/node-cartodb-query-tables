'use strict';

const DatabaseTables = require('./models/database_tables');

const affectedTableRegexCache = {
    bbox: /!bbox!/g,
    scale_denominator: /!scale_denominator!/g,
    pixel_width: /!pixel_width!/g,
    pixel_height: /!pixel_height!/g,
    var_zoom: /@zoom/g,
    var_bbox: /@bbox/g,
    var_x: /@x/g,
    var_y: /@y/g
};


module.exports.getAffectedTableNamesFromQuery = function (pg, sql, callback) {
    const query = 'SELECT CDB_QueryTablesText($windshaft$' + prepareSql(sql) + '$windshaft$)';

    pg.query(query, (err, result) => {
        if (err) {
            const msg = err.message ? err.message : err;
            return callback(new Error('Could not fetch source tables: ' + msg));
        }

        result = result || {};
        const rows = result.rows || [];

        // This is an Array, so no need to split into parts
        const tableNames = (!!rows[0]) ? rows[0].cdb_querytablestext : [];
        return callback(null, tableNames);
    });
};

module.exports.getAffectedTablesFromQuery = function (pg, sql, callback) {
    const query = 'SELECT * FROM CDB_QueryTables_Updated_At($windshaft$' + prepareSql(sql) + '$windshaft$)';

    pg.query(query, (err, result) => {
        if (err) {
            const msg = err.message ? err.message : err;
            return callback(new Error('could not fetch affected tables or last updated time: ' + msg));
        }
        result = result || {};
        const rows = result.rows || [];

        callback(null, new DatabaseTables(rows));
    });
};

function prepareSql(sql) {
    return sql
        .replace(affectedTableRegexCache.bbox, 'ST_MakeEnvelope(0,0,0,0)')
        .replace(affectedTableRegexCache.scale_denominator, '0')
        .replace(affectedTableRegexCache.pixel_width, '1')
        .replace(affectedTableRegexCache.pixel_height, '1')
        .replace(affectedTableRegexCache.var_zoom, '0')
        .replace(affectedTableRegexCache.var_bbox, '[0,0,0,0]')
        .replace(affectedTableRegexCache.var_x, '0')
        .replace(affectedTableRegexCache.var_y, '0')
    ;
}

module.exports.DatabaseTablesEntry = DatabaseTables;
