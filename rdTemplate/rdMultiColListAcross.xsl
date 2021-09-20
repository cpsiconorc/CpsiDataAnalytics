<xsl:variable name="nColumnCnt" select="rdXslExtension:GetTokenValue('rdColumns')" />
<xsl:for-each select="/*/rdDataID">
  <xsl:variable name="nPageRowCnt" select="0" />
  <xsl:variable name="nPageNr" select="1" />
  <xsl:if test="position() != 1 and (position() - 1) mod $nColumnCnt = 0">
    <TR />
	</xsl:if>
	<TD style="vertical-align:top;nowrap:nowrap;">
		rdListRecord
	</TD>
</xsl:for-each>
