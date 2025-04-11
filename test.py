def funct1():
  df=101
  def funct2():
    global df
    df=102
    print("in funct2",df)
  funct2()
  print("aaa",df)
  return df
