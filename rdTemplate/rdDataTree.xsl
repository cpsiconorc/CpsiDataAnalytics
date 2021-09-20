
<TreeRows>
	<xsl:for-each select="rdDataID" >
		<xsl:variable name="rdDataTreeID-Position" select="position()"/>
		<rdTreeRows />
	</xsl:for-each>
</TreeRows>
