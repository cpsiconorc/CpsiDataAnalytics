<xsl:variable name="nColumnCnt" select="rdXslExtension:GetTokenValue('rdColumns')" />

  <xsl:variable name="nPageRowCnt" select="0" />
  <xsl:variable name="nPageNr" select="1" />
  <xsl:for-each select="/*/rdDataID">

    <!--Number of full columns-->
    <xsl:variable name="nFullColumnsCnt">
      <xsl:choose>
        <xsl:when test="last() mod $nColumnCnt = 0">
          <xsl:value-of select="$nColumnCnt"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="last() mod $nColumnCnt"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!--Number of rows in a full column-->
    <xsl:variable name="nRowsPerFullColumn">
      <xsl:choose>
        <xsl:when test="last() mod $nColumnCnt = 0">
          <xsl:value-of select="last() div $nColumnCnt"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="floor(last() div $nColumnCnt) + 1"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!--Number of rows in the other columns-->
    <xsl:variable name="nRowsPerReducedColumn">
      <xsl:value-of select="$nRowsPerFullColumn - 1"/>
    </xsl:variable>

    <!--Number of rows in all the full columns-->
    <xsl:variable name="nFullColumnsRowCnt">
      <xsl:value-of select="$nFullColumnsCnt * $nRowsPerFullColumn"/>
    </xsl:variable>

    

    <xsl:choose>
      <xsl:when test="position() &lt;= $nFullColumnsRowCnt">
        <xsl:choose>
          <xsl:when test="(position()-1) mod $nRowsPerFullColumn = 0">
            <TD style="vertical-align:top;nowrap:nowrap;padding:4px;" /><rdMclTdStart />
              rdListRecord
            </xsl:when>
            <xsl:otherwise>
              <BR />
              rdListRecord
            </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="(position() - $nFullColumnsRowCnt - 1) mod ($nRowsPerReducedColumn) = 0">
             <TD style="vertical-align:top;nowrap:nowrap;padding:4px;"/><rdMclTdStart />
           rdListRecord
          </xsl:when>
          <xsl:otherwise>
            <BR />
            rdListRecord
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
    <rdMclTdEnd />
    
    
	</xsl:for-each>

