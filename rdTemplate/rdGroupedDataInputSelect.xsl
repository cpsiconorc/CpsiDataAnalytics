<SPAN id="rdInputOptions">
  <xsl:for-each select="/*/rdElementID" >
    <rdGroupOpen />
	    <xsl:for-each select="rdElementID" >
			  <rdOptionRows />
	    </xsl:for-each>
    <rdGroupClose />
  </xsl:for-each>
</SPAN>
