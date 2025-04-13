Requirement Background: 

I work in a team that works on building Backend Microservices for an enterprise application. There was 3 personas that are relevant for my conversation here 

c) Product Owners (PO) - provide the requirements to both Developer and QA teams. The PO is also supposed to provide business scenarios for the requirements.
a) Developers (Dev) - who 1st understand the requirements from the PO and will 1st translate the same into Design which culminates in an OpenAPI spec and then will create and maintain the APIs and in the process they will be releasing the OpenAPI spec files in a central registry 
b) Quality Assurance (QA) Who understand requirements from the PO and design (OpenAPI spec) from the dev teams. They will then test the APIs to try and see if the functionality is being achieved.

The problem is that there is no structured way for PO & QA team to capture the business and test scenarios respectively. But if you abstract away they post are giving instructions on how to call APIs with specific data and in specific order and validating if the output is matching their expectations. 

The app we are building is meant for PO & QA teams to build the scenarios and provide input and expected output data. They are comfortable in Excel interface.

Actual Requirement:
We need to build a WebApp which will allow both PO & QA teams to 
1. Pick and choose APIs from list of available APIs from the registry to build a bunch of scenarios
2. For each of the scenarios they will then provide data needed and then provide expected output. - Remember what I said about Excel like interface here.

