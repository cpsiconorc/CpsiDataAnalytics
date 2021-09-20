<xsl:variable name="nColumnCnt" select="rdXslExtension:GetTokenValue('rdColumns')" />

<TD>
	<xsl:for-each select="rdDataID">
		<xsl:if test="position()!=1 and position()!=last() and ((position()-1) mod (last() div $nColumnCnt)) &lt; 1">
			<TD />
		</xsl:if>
		rdListRecord
		<BR />
	</xsl:for-each>
</TD>

