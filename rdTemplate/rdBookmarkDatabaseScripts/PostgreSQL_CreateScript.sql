	/***Replace table name to the name which you'll use in application***/
	CREATE TABLE @TableName (
		Id varchar(255) CONSTRAINT idkey_@TableName PRIMARY KEY,
		Value text NOT NULL,
		ModifiedTime varchar(255) NOT NULL
	);