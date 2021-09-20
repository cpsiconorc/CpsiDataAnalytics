
<xsl:variable name="nLastPageNr" select="rdXslExtension:GetTokenValue('@Session.rdElementID-LastPageNr~')" />
<xsl:variable name="nPageRowCnt" select="rdXslExtension:GetTokenValue('@Session.rdElementID-PageRowCnt~')" />
<xsl:variable name="nPageNr" select="rdXslExtension:GetTokenValue('@Session.rdElementID-PageNr~')" />

<TableRows>
	<xsl:for-each select="/*/rdDataID" >
    <xsl:variable name="rdDataTableID-Position" select="position() + $nPageRowCnt * ($nPageNr - 1)"/>
      <rdTableRows />
      <rdRowEnd />
	</xsl:for-each>
</TableRows>
