def funct1():
  df=101
  def funct2():
    global df
    df=102
  funct2() 
  return df
