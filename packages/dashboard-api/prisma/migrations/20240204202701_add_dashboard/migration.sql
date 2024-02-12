CREATE VIEW IF NOT EXISTS dashboard 
AS
SELECT 
    p.id AS propertyId,
    p.country AS country,
    p.city AS city,
    p.street AS street,
    p.buildingNumber AS buildingNumber,
    p.occupied AS occupied,
    r.id AS residentId,
    r.firstName AS firstName,
    r.lastName AS lastName
FROM
    property p
LEFT JOIN 
    resident r 
        ON p.id = r.propertyId;