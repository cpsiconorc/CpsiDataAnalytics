	/***Replace table name to the name which you'll use in application***/
	CREATE TABLE @TableName 
	(
		`Id` VARCHAR(255) NOT NULL,
		`Value` MEDIUMTEXT NOT NULL,
		`ModifiedTime` TEXT NOT NULL,
		PRIMARY KEY (`Id`)
	);