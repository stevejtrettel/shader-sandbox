import numpy as np
W,H=16,12
def weights(i,j,W,H):
    x=i/W; y=j/H   # float(ij.x)/resolution.x  -> never 1.0 for valid i
    if i==1 and j==1: w=[0,1,1,0,-3,1,0,0,0]
    elif i==1 and y==1.: w=[0,0,0,0,-3,1,0,1,1]
    elif x==1. and j==1: w=[1,1,0,1,-3,0,0,0,0]
    elif x==1. and y==1.: w=[0,0,0,1,-3,0,1,1,0]
    elif i==1: w=[0,.5,.5,0,-3,1,0,.5,.5]
    elif x==1.: w=[.5,.5,0,1,-3,0,.5,.5,0]
    elif j==1: w=[.5,1,.5,.5,-1,.5,0,0,0]
    elif y==1.: w=[0,0,0,.5,-1,.5,.5,1,.5]
    else: w=[.25,.5,.25,.5,-3,.5,.25,.5,.25]
    return w
offs=[(-1,1),(0,1),(1,1),(-1,0),(0,0),(1,0),(-1,-1),(0,-1),(1,-1)]
def build(wfun):
    L=np.zeros((W*H,W*H))
    for j in range(H):
        for i in range(W):
            w=wfun(i,j,W,H)
            for (di,dj),ww in zip(offs,w):
                ii,jj=i+di,j+dj
                if 0<=ii<W and 0<=jj<H: L[j*W+i,jj*W+ii]+=ww   # out-of-range texelFetch -> 0 (as observed in ANGLE/SwiftShader)
    return L
Llib=build(weights)
Lint=build(lambda i,j,W,H:[.25,.5,.25,.5,-3,.5,.25,.5,.25])
for name,L in [('lib laplacian9PointZeroBoundary',Llib),('plain 9-pt with zero ghost cells (true Dirichlet-0)',Lint)]:
    ev=np.linalg.eigvals(L)
    print(f"{name}: symmetric={np.allclose(L,L.T)}  max Re(eig)={ev.real.max():+.4f}  min Re={ev.real.min():+.4f}  max|Im|={abs(ev.imag).max():.4f}  #eig with Re>1e-9: {(ev.real>1e-9).sum()}")
# verify transcription against the executed GLSL numbers: constant field row sums on 8x6
W,H=8,6; L=build(weights); print('row sums 8x6 (transcription):'); print(L.sum(1).reshape(H,W)[::-1])
