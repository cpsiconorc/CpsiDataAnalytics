	/***Replace table name to the name which you'll use in application***/
	CREATE TABLE @TableName (
		[Id] [nvarchar](255) NOT NULL PRIMARY KEY,
		[Value] [varchar](max) NOT NULL,
		[ModifiedTime] [varchar](max) NOT NULL
	);