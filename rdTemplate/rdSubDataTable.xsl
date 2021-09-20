
<TableRows>
	<xsl:for-each select="rdDataID" >
		<xsl:variable name="rdDataTableID-Position" select="position()"/>
			<rdTableRows />
    <rdRowEnd />
	</xsl:for-each>
</TableRows>
