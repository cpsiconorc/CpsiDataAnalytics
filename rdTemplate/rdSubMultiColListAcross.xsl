<xsl:variable name="nColumnCnt" select="rdXslExtension:GetTokenValue('rdColumns')" />

<xsl:for-each select="rdDataID">
	<xsl:if test="position() != 1 and (position() - 1) mod $nColumnCnt = 0">
		<TR />
	</xsl:if>
	<TD>
		rdListRecord
	</TD>
</xsl:for-each>
