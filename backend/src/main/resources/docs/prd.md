I need a utility service that will act as a backend API for a front end system that enables users to form request DTOs in structured i.e. Tabular format.


As far as front end is concerned in needs a GET end point "/action-codes" that will return a JSON that describes each of the end points. A sample JSON is available in `docs/ActionCodeList.json`

There is also a manifest file `docs/apiList.json` which will have pointers to schema files.

Here are fields and their mappings:


componentName: from key of "components" in `docs/apiList.json`
actionCode: from key of "apiSchemas" within "components" in `docs/apiList.json`
actionCodeGroupName: from "tags" in `docs/create-demandCode.json`
endPoint: from "paths" in `docs/create-demandCode.json`
type: If Path is "post" then "PostAndVerify" / If Path is  "get" then "FetchAndVerify" 
pathPropertyListMap: from "parameters" in `docs/create-demandCode.json` -> if "in": "path" then add to "PathParamList" / If "in": "query" then add to "QueryParamList"
RequestBodyColumnList: This needs processing
1. Deference all $ref pointers
2. Classify attributes from the "properties" of "schemas" in "components" into container and basic
3. For each basic attribute dump 
    1. key as "technicalColumnName"
    2. "isMandatory" will be true if attribute is in "required" list
    3. "derivedDataType" - will 
4. For each of the container attributes - we need to flatten the attrbutes based on location of the attribute linked to container. 
5. Steps 2, 3, 4 need to be till each attribute in the tree is added   


Caveats / Validations:
1. Only 1 Path will be present per file